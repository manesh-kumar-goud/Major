"""
Prediction service with optimized model training and inference
Uses load-once model caching and auto-learning brain
"""
import numpy as np
from typing import Dict, List
from datetime import datetime, timedelta
from services.stock_service import StockService
from ml.models import LSTMModel, RNNModel
from ml.utils import preprocess_data, create_sequences, inverse_transform
from core.config import settings
import logging

logger = logging.getLogger("stock_forecasting")

class PredictionService:
    """Service for stock price predictions with load-once caching and auto-learning"""
    
    def __init__(self):
        self.stock_service = StockService()
        self.sequence_length = settings.SEQUENCE_LENGTH
        
        # Initialize model loader (load-once caching)
        try:
            from ml.model_loader import get_model_loader
            self.model_loader = get_model_loader()
            logger.info("✅ Model loader initialized")
        except Exception as e:
            logger.warning(f"Could not initialize model loader: {e}")
            self.model_loader = None
        
        # Initialize auto-learning brain
        try:
            from ml.auto_learning import get_brain
            self.brain = get_brain()
            logger.info("✅ Auto-learning brain initialized")
        except Exception as e:
            logger.warning(f"Could not initialize auto-learning brain: {e}")
            self.brain = None
        
        # Initialize model registry if MLflow is enabled
        if settings.MLFLOW_ENABLED:
            try:
                from ml.model_registry import get_registry
                self.registry = get_registry()
            except Exception as e:
                logger.warning(f"Could not initialize model registry: {e}")
                self.registry = None
        else:
            self.registry = None
    
    async def predict(
        self,
        ticker: str,
        model_type: str,
        period: str,
        prediction_days: int,
        epochs: int = None,
        batch_size: int = None,
        sequence_length: int = None
    ) -> Dict:
        """Make stock price prediction"""
        logger.info(f"Making prediction: {ticker}, {model_type}, {period}, {prediction_days} days")
        
        # Override sequence_length if provided
        original_sequence_length = self.sequence_length
        if sequence_length is not None:
            self.sequence_length = sequence_length
            logger.info(f"Using custom sequence_length: {sequence_length} (default: {original_sequence_length})")
        
        # Get historical data - REAL DATA ONLY
        historical_data = await self.stock_service.get_stock_history(ticker, period)
        
        if not historical_data or len(historical_data) < self.sequence_length:
            error_msg = (
                f"Insufficient data for {ticker}. Received {len(historical_data) if historical_data else 0} data points, "
                f"but need at least {self.sequence_length} points. Try a longer period or check if the stock symbol is valid."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Extract close prices
        close_prices = np.array([float(item['close']) for item in historical_data])
        
        # Preprocess data
        scaled_data, scaler = preprocess_data(close_prices)
        
        # Create sequences
        X, y = create_sequences(scaled_data, self.sequence_length)
        
        if len(X) == 0:
            raise ValueError("Unable to create training sequences from data")
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Get or create model using load-once system
        model_type_upper = model_type.upper()
        
        # Support for next-gen models (PatchTST, etc.)
        if model_type_upper == "PATCHTST":
            try:
                from ml.models.patchtst import PatchTSTModel
                model = PatchTSTModel(
                    context_window=self.sequence_length,
                    patch_len=16,
                    stride=8,
                    revin=True
                )
                logger.info("Using PatchTST model for prediction")
            except ImportError:
                logger.warning("PatchTST not available, falling back to LSTM")
                model_type_upper = "LSTM"  # Fallback
            except Exception as e:
                logger.error(f"Error initializing PatchTST: {e}, falling back to LSTM")
                model_type_upper = "LSTM"  # Fallback
        
        # Try to get cached model from registry first (for LSTM/RNN)
        if model_type_upper in ["LSTM", "RNN"]:
            model = None
            if self.model_loader:
                model = self.model_loader.get_model(model_type_upper, "champion", fallback_to_new=False)
            
            # If no cached model, create new one with improved defaults
            if model is None:
                logger.info(f"Creating new {model_type_upper} model (not in cache)")
                if model_type_upper == "LSTM":
                    # Enhanced defaults for 80% accuracy: 256 units, 3-layer stacked LSTM
                    model = LSTMModel(units=256, dropout=0.2, use_stacked=True)
                elif model_type_upper == "RNN":
                    # Enhanced defaults: 256 units, optimized dropout
                    model = RNNModel(units=256, dropout=0.2)
                else:
                    raise ValueError(f"Invalid model type: {model_type}. Must be 'LSTM', 'RNN', or 'PATCHTST'")
            else:
                logger.info(f"Using cached {model_type_upper} model from registry")
        
        # Get optimal hyperparameters from auto-learning brain
        # Enhanced defaults for 80% accuracy target
        default_epochs = 100  # Increased for better training
        default_batch_size = 32
        default_learning_rate = 0.0008  # Optimized learning rate for better convergence
        
        # Use provided hyperparameters or defaults
        hyperparams = {
            "epochs": epochs if epochs is not None else default_epochs,
            "batch_size": batch_size if batch_size is not None else default_batch_size,
            "learning_rate": default_learning_rate
        }
        
        logger.info(f"Training hyperparameters: epochs={hyperparams['epochs']}, batch_size={hyperparams['batch_size']}, sequence_length={self.sequence_length}")
        
        # Only use auto-learning suggestions if user didn't provide custom values
        if self.brain and epochs is None and batch_size is None:
            try:
                suggested = self.brain.suggest_hyperparameters(
                    model_type=model_type_upper,
                    data_size=len(X_train)
                )
                # Only update if user didn't provide custom values
                if epochs is None:
                    hyperparams["epochs"] = suggested.get("epochs", default_epochs)
                if batch_size is None:
                    hyperparams["batch_size"] = suggested.get("batch_size", default_batch_size)
                hyperparams["learning_rate"] = suggested.get("learning_rate", default_learning_rate)
                logger.info(f"Auto-learning suggested: {hyperparams}")
            except Exception as e:
                logger.warning(f"Could not get hyperparameter suggestions: {e}")
        else:
            logger.info(f"Using user-provided hyperparameters (auto-learning skipped)")
        
        # Train model with improved hyperparameters
        logger.info(f"🔧 Training {model_type_upper} model...")
        logger.info(f"   Hyperparameters: epochs={hyperparams['epochs']}, batch_size={hyperparams['batch_size']}, lr={hyperparams.get('learning_rate', default_learning_rate)}")
        
        model.train(
            X_train, 
            y_train, 
            epochs=hyperparams["epochs"], 
            batch_size=hyperparams["batch_size"],
            learning_rate=hyperparams.get("learning_rate", default_learning_rate),
            verbose=1  # Enable verbose to see training progress
        )
        
        logger.info(f"✅ Model training completed successfully!")
        
        # Make predictions
        predictions = model.predict(X_test)
        
        # Calculate metrics with training data for MASE
        metrics = model.evaluate(y_test, predictions, y_train=y_train)
        metrics['model_type'] = model_type
        
        # Cache trained model and optionally save to registry with safe promotion
        if self.model_loader or (self.registry and settings.MLFLOW_ENABLED):
            try:
                # Prepare model parameters
                model_params = {
                    "units": model.units if hasattr(model, 'units') else 50,
                    "epochs": hyperparams["epochs"],
                    "batch_size": hyperparams["batch_size"],
                    "sequence_length": self.sequence_length,
                    "ticker": ticker,
                    "period": period,
                    "model_type": model_type_upper
                }
                
                # For PatchTST, add specific parameters
                if model_type_upper == "PATCHTST" and hasattr(model, 'patch_len'):
                    model_params.update({
                        "patch_len": model.patch_len,
                        "stride": model.stride,
                        "d_model": model.d_model,
                        "n_heads": model.n_heads,
                        "n_layers": model.n_layers,
                        "revin": model.revin
                    })
                
                # Try safe promotion if MLflow is enabled
                if settings.MLFLOW_ENABLED and model_type_upper in ["LSTM", "RNN"]:
                    try:
                        from ml.safe_promotion import get_promoter
                        promoter = get_promoter()
                        
                        # Evaluate and potentially promote
                        promotion_result = await promoter.evaluate_and_promote(
                            model_type=model_type_upper,
                            model=model,
                            data=close_prices,
                            metrics=metrics,
                            params=model_params,
                            model_name=f"StockNeuro_{model_type_upper}"
                        )
                        
                        if promotion_result.get("promoted"):
                            logger.info(f"✅ {model_type_upper} model promoted to champion: {promotion_result.get('reason')}")
                        else:
                            logger.info(f"ℹ️ {model_type_upper} model not promoted: {promotion_result.get('reason')}")
                            
                    except Exception as e:
                        logger.warning(f"Safe promotion check failed: {e}, using standard caching")
                        # Fallback to standard caching
                        if self.model_loader:
                            self.model_loader.cache_trained_model(
                                model=model,
                                model_type=model_type_upper,
                                alias="latest",
                                metrics=metrics,
                                params=model_params
                            )
                elif settings.MLFLOW_ENABLED and model_type_upper == "PATCHTST":
                    # For PatchTST, save directly to registry
                    try:
                        model_name = f"StockNeuro_{model_type_upper}"
                        version = self.registry.save_model(
                            model=model,
                            model_name=model_name,
                            metrics=metrics,
                            params=model_params
                        )
                        if version:
                            logger.info(f"✅ PatchTST model saved to registry as version {version}")
                    except Exception as e:
                        logger.warning(f"Could not save PatchTST to registry: {e}")
                else:
                    # Standard caching without promotion
                    if self.model_loader:
                        self.model_loader.cache_trained_model(
                            model=model,
                            model_type=model_type_upper,
                            alias="latest",
                            metrics=metrics,
                            params=model_params
                        )
                
                logger.info(f"Cached trained {model_type_upper} model")
            except Exception as e:
                logger.warning(f"Could not cache model: {e}")
        
        # Inverse transform
        predictions_rescaled = inverse_transform(predictions, scaler)
        actual_rescaled = inverse_transform(y_test, scaler)
        
        # Generate future predictions
        last_sequence = scaled_data[-self.sequence_length:].copy()
        future_predictions = []
        
        try:
            logger.info(f"Generating {prediction_days} future predictions...")
            for i in range(prediction_days):
                # Ensure proper shape: (1, sequence_length, 1)
                input_sequence = np.array(last_sequence, dtype=np.float32).reshape(1, self.sequence_length, 1)
                next_pred = model.predict_single(input_sequence)
                
                # Handle different prediction output shapes
                if isinstance(next_pred, np.ndarray):
                    if next_pred.ndim == 2:
                        pred_value = float(next_pred[0, 0])
                    elif next_pred.ndim == 1:
                        pred_value = float(next_pred[0])
                    else:
                        pred_value = float(next_pred.flatten()[0])
                else:
                    pred_value = float(next_pred)
                
                future_predictions.append(pred_value)
                # Update sequence: remove first element, append prediction
                last_sequence = np.append(last_sequence[1:], pred_value)
            logger.info(f"Successfully generated {len(future_predictions)} future predictions")
        except Exception as e:
            logger.error(f"Error generating future predictions: {e}", exc_info=True)
            # Fallback: use simple trend-based prediction
            last_price = scaled_data[-1]
            if len(scaled_data) >= 10:
                trend = (scaled_data[-1] - scaled_data[-10]) / 10
            else:
                trend = (scaled_data[-1] - scaled_data[0]) / len(scaled_data) if len(scaled_data) > 1 else 0
            future_predictions = [last_price + trend * (i + 1) for i in range(prediction_days)]
            logger.warning("Using fallback trend-based predictions")
        
        future_predictions_rescaled = inverse_transform(
            np.array(future_predictions).reshape(-1, 1), scaler
        )
        
        # Prepare dates
        try:
            # Calculate dates for historical predictions
            # Test data starts from split_idx in sequences, which corresponds to 
            # split_idx + sequence_length in original data
            test_start_idx = split_idx + self.sequence_length
            historical_dates = []
            for i in range(len(actual_rescaled)):
                idx = test_start_idx + i
                if idx < len(historical_data):
                    historical_dates.append(historical_data[idx]['date'])
                else:
                    # Fallback: use last available date
                    historical_dates.append(historical_data[-1]['date'])
        except (IndexError, KeyError) as e:
            logger.warning(f"Error preparing historical dates: {e}, using fallback")
            # Fallback: generate dates from the end of historical data
            historical_dates = [
                (datetime.now() - timedelta(days=len(actual_rescaled)-i)).strftime('%Y-%m-%d')
                for i in range(len(actual_rescaled))
            ]
        
        future_dates = [
            (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d')
            for i in range(prediction_days)
        ]
        
        return {
            'ticker': ticker,
            'model_type': model_type,
            'historical_data': {
                'dates': historical_dates,
                'actual': actual_rescaled.flatten().tolist(),
                'predicted': predictions_rescaled.flatten().tolist()
            },
            'future_predictions': {
                'dates': future_dates,
                'predictions': future_predictions_rescaled.flatten().tolist()
            },
            'metrics': metrics,
            'last_price': float(close_prices[-1]),
            'prediction_summary': {
                'trend': 'bullish' if np.mean(future_predictions_rescaled) > close_prices[-1] else 'bearish',
                'avg_predicted_price': float(np.mean(future_predictions_rescaled)),
                'price_change_percent': float(((np.mean(future_predictions_rescaled) - close_prices[-1]) / close_prices[-1]) * 100)
            },
            'data_source': 'RapidAPI Yahoo Finance',
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    async def compare_models(self, ticker: str, period: str) -> Dict:
        """Compare LSTM vs RNN models"""
        logger.info(f"Comparing models for {ticker}")
        
        # Get historical data
        historical_data = await self.stock_service.get_stock_history(ticker, period)
        
        if not historical_data or len(historical_data) < 100:
            raise ValueError("Insufficient historical data for comparison")
        
        # Extract close prices
        close_prices = np.array([float(item['close']) for item in historical_data])
        
        # Preprocess data
        scaled_data, scaler = preprocess_data(close_prices)
        
        # Create sequences
        X, y = create_sequences(scaled_data, self.sequence_length)
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train both models
        lstm_model = LSTMModel(units=50)
        rnn_model = RNNModel(units=50)
        
        lstm_model.train(X_train, y_train, epochs=20, batch_size=32, verbose=0)
        rnn_model.train(X_train, y_train, epochs=20, batch_size=32, verbose=0)
        
        # Get predictions
        lstm_predictions = lstm_model.predict(X_test)
        rnn_predictions = rnn_model.predict(X_test)
        
        # Calculate metrics
        lstm_metrics = lstm_model.evaluate(y_test, lstm_predictions)
        rnn_metrics = rnn_model.evaluate(y_test, rnn_predictions)
        
        # Inverse transform
        lstm_pred_rescaled = inverse_transform(lstm_predictions, scaler)
        rnn_pred_rescaled = inverse_transform(rnn_predictions, scaler)
        actual_rescaled = inverse_transform(y_test, scaler)
        
        # Prepare dates
        try:
            # Calculate dates for comparison data
            test_start_idx = split_idx + self.sequence_length
            historical_dates = []
            for i in range(len(actual_rescaled)):
                idx = test_start_idx + i
                if idx < len(historical_data):
                    historical_dates.append(historical_data[idx]['date'])
                else:
                    # Fallback: use last available date
                    historical_dates.append(historical_data[-1]['date'])
        except (IndexError, KeyError) as e:
            logger.warning(f"Error preparing comparison dates: {e}, using fallback")
            # Fallback: generate dates from the end of historical data
            historical_dates = [
                (datetime.now() - timedelta(days=len(actual_rescaled)-i)).strftime('%Y-%m-%d')
                for i in range(len(actual_rescaled))
            ]
        
        return {
            'ticker': ticker,
            'comparison_data': {
                'dates': historical_dates,
                'actual': actual_rescaled.flatten().tolist(),
                'lstm_predictions': lstm_pred_rescaled.flatten().tolist(),
                'rnn_predictions': rnn_pred_rescaled.flatten().tolist()
            },
            'model_metrics': {
                'lstm': lstm_metrics,
                'rnn': rnn_metrics
            },
            'winner': 'LSTM' if lstm_metrics.get('rmse', 999999) < rnn_metrics.get('rmse', 999999) else 'RNN'
        }


