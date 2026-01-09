"""
Safe Model Promotion System for StockNeuro
Uses walk-forward backtesting with MASE/sMAPE to safely promote models
"""
import numpy as np
from typing import Dict, Optional, Any, List
import logging

from ml.evaluation.backtesting import WalkForwardBacktester
from ml.metrics import calculate_all_metrics
from ml.model_registry import get_registry
from ml.models import LSTMModel, RNNModel
from ml.utils import preprocess_data, create_sequences, inverse_transform
from core.config import settings

logger = logging.getLogger("stock_forecasting")


class SafeModelPromoter:
    """
    Safely promotes models to champion using walk-forward backtesting
    Only promotes if new model is significantly better (threshold-based)
    """
    
    def __init__(self):
        self.registry = get_registry() if settings.MLFLOW_ENABLED else None
        self.promotion_threshold = 0.05  # 5% improvement required
        self.min_splits = 3  # Minimum number of backtest splits required
    
    def evaluate_model_with_backtesting(
        self,
        model_type: str,
        data: np.ndarray,
        sequence_length: int = 60,
        train_size: int = 200,
        test_size: int = 50,
        step_size: int = 25
    ) -> Dict[str, Any]:
        """
        Evaluate model using walk-forward backtesting
        
        Args:
            model_type: "LSTM" or "RNN"
            data: Historical price data
            sequence_length: Sequence length for model
            train_size: Training window size for backtesting
            test_size: Test window size for backtesting
            step_size: Step size for moving window
        
        Returns:
            Dictionary with backtest results and metrics
        """
        logger.info(f"Evaluating {model_type} model with walk-forward backtesting")
        
        # Preprocess data
        scaled_data, scaler = preprocess_data(data)
        
        # Create sequences
        X, y = create_sequences(scaled_data, sequence_length)
        
        if len(X) < train_size + test_size:
            raise ValueError(
                f"Insufficient data for backtesting: {len(X)} sequences, "
                f"need at least {train_size + test_size}"
            )
        
        # Define model training function
        def train_model_fn(train_data):
            """Train model on given data"""
            # Extract sequences for training
            train_X, train_y = create_sequences(train_data, sequence_length)
            
            if len(train_X) == 0:
                raise ValueError("Cannot create sequences from training data")
            
            # Create and train model
            if model_type.upper() == "LSTM":
                model = LSTMModel(units=50)
            elif model_type.upper() == "RNN":
                model = RNNModel(units=50)
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            model.train(train_X, train_y, epochs=20, batch_size=32, verbose=0)
            return model
        
        # Define prediction function
        def predict_fn(model, test_data):
            """Make predictions on test data"""
            # Extract sequences for testing
            test_X, test_y = create_sequences(test_data, sequence_length)
            
            if len(test_X) == 0:
                return np.array([])
            
            predictions = model.predict(test_X)
            return predictions
        
        # Run walk-forward backtest
        backtester = WalkForwardBacktester(
            train_size=train_size,
            test_size=test_size,
            step_size=step_size,
            strategy="rolling"
        )
        
        backtest_results = backtester.backtest(
            data=scaled_data,
            model_train_fn=train_model_fn,
            model_predict_fn=predict_fn,
            verbose=False
        )
        
        # Calculate aggregate metrics
        if backtest_results.get("total_splits", 0) < self.min_splits:
            raise ValueError(
                f"Insufficient backtest splits: {backtest_results.get('total_splits', 0)}, "
                f"need at least {self.min_splits}"
            )
        
        # Extract metrics from all splits
        split_results = backtest_results.get("split_results", [])
        all_metrics = []
        
        for split_result in split_results:
            if "metrics" in split_result:
                metrics = split_result["metrics"]
                all_metrics.append({
                    "rmse": metrics.get("rmse", np.nan),
                    "mae": metrics.get("mae", np.nan),
                    "mase": metrics.get("mase", np.nan),
                    "smape": metrics.get("smape", np.nan),
                    "r2_score": metrics.get("r2_score", np.nan)
                })
        
        # Calculate mean metrics
        mean_metrics = {
            "rmse": np.nanmean([m["rmse"] for m in all_metrics]),
            "mae": np.nanmean([m["mae"] for m in all_metrics]),
            "mase": np.nanmean([m["mase"] for m in all_metrics]),
            "smape": np.nanmean([m["smape"] for m in all_metrics]),
            "r2_score": np.nanmean([m["r2_score"] for m in all_metrics])
        }
        
        return {
            "model_type": model_type,
            "backtest_results": backtest_results,
            "metrics": mean_metrics,
            "total_splits": backtest_results.get("total_splits", 0),
            "evaluation_passed": True
        }
    
    def should_promote(
        self,
        candidate_metrics: Dict[str, float],
        champion_metrics: Dict[str, float]
    ) -> Tuple[bool, str]:
        """
        Determine if candidate model should be promoted
        
        Args:
            candidate_metrics: Metrics from candidate model backtest
            champion_metrics: Metrics from current champion model backtest
        
        Returns:
            Tuple of (should_promote: bool, reason: str)
        """
        # Primary metric: MASE (lower is better)
        candidate_mase = candidate_metrics.get("mase", float('inf'))
        champion_mase = champion_metrics.get("mase", float('inf'))
        
        if np.isnan(candidate_mase) or np.isnan(champion_mase):
            # Fallback to RMSE if MASE unavailable
            candidate_rmse = candidate_metrics.get("rmse", float('inf'))
            champion_rmse = champion_metrics.get("rmse", float('inf'))
            
            if np.isnan(candidate_rmse) or np.isnan(champion_rmse):
                return False, "Cannot compare: missing metrics"
            
            improvement = (champion_rmse - candidate_rmse) / champion_rmse
            if improvement >= self.promotion_threshold:
                return True, f"RMSE improved by {improvement*100:.2f}%"
            else:
                return False, f"RMSE improvement {improvement*100:.2f}% below threshold {self.promotion_threshold*100:.2f}%"
        
        # Use MASE for comparison
        improvement = (champion_mase - candidate_mase) / champion_mase
        
        if improvement >= self.promotion_threshold:
            # Also check sMAPE as secondary metric
            candidate_smape = candidate_metrics.get("smape", float('inf'))
            champion_smape = champion_metrics.get("smape", float('inf'))
            
            if not (np.isnan(candidate_smape) or np.isnan(champion_smape)):
                smape_improvement = (champion_smape - candidate_smape) / champion_smape
                if smape_improvement < 0:
                    return False, f"MASE improved but sMAPE degraded by {abs(smape_improvement)*100:.2f}%"
            
            return True, f"MASE improved by {improvement*100:.2f}%"
        else:
            return False, f"MASE improvement {improvement*100:.2f}% below threshold {self.promotion_threshold*100:.2f}%"
    
    async def evaluate_and_promote(
        self,
        model_type: str,
        model: Any,
        data: np.ndarray,
        metrics: Dict[str, float],
        params: Dict[str, Any],
        model_name: str
    ) -> Dict[str, Any]:
        """
        Evaluate candidate model and promote if better than champion
        
        Args:
            model_type: "LSTM" or "RNN"
            model: Trained model instance
            data: Historical data used for training
            metrics: Training metrics
            params: Model parameters
            model_name: Name in MLflow registry
        
        Returns:
            Dictionary with promotion result
        """
        if not self.registry:
            logger.warning("Model registry not available, skipping promotion check")
            return {
                "promoted": False,
                "reason": "Model registry not available"
            }
        
        try:
            # Evaluate candidate with backtesting
            logger.info(f"Evaluating candidate {model_type} model with walk-forward backtesting")
            candidate_eval = self.evaluate_model_with_backtesting(
                model_type=model_type,
                data=data,
                sequence_length=params.get("sequence_length", 60)
            )
            
            candidate_metrics = candidate_eval["metrics"]
            
            # Get current champion metrics
            try:
                champion_versions = self.registry._client.get_latest_versions(
                    model_name,
                    stages=["Champion"]
                )
                
                if champion_versions:
                    champion_version = champion_versions[0]
                    champion_run = self.registry._client.get_run(champion_version.run_id)
                    
                    # Get champion metrics (try to get from run metrics)
                    champion_metrics = {
                        "rmse": champion_run.data.metrics.get("rmse", float('inf')),
                        "mae": champion_run.data.metrics.get("mae", float('inf')),
                        "mase": champion_run.data.metrics.get("mase", float('inf')),
                        "smape": champion_run.data.metrics.get("smape", float('inf'))
                    }
                    
                    # If champion doesn't have backtest metrics, evaluate it
                    if champion_metrics.get("mase", np.nan) == np.nan:
                        logger.info("Champion model missing backtest metrics, evaluating...")
                        # Note: In production, you'd load the champion model and evaluate it
                        # For now, we'll use the stored metrics
                        champion_metrics = {
                            "rmse": champion_run.data.metrics.get("rmse", float('inf')),
                            "mae": champion_run.data.metrics.get("mae", float('inf')),
                            "mase": float('inf'),  # Unknown, will use RMSE fallback
                            "smape": float('inf')
                        }
                else:
                    # No champion exists, promote this one
                    logger.info("No champion exists, promoting first model")
                    version = self.registry.save_model(
                        model=model,
                        model_name=model_name,
                        metrics={**metrics, **candidate_metrics},
                        params=params
                    )
                    
                    if version:
                        self.registry._client.transition_model_version_stage(
                            name=model_name,
                            version=version,
                            stage="Champion"
                        )
                        return {
                            "promoted": True,
                            "reason": "First model, automatically promoted",
                            "version": version,
                            "candidate_metrics": candidate_metrics
                        }
                    else:
                        return {
                            "promoted": False,
                            "reason": "Failed to save model to registry"
                        }
                
                # Compare candidate vs champion
                should_promote, reason = self.should_promote(
                    candidate_metrics,
                    champion_metrics
                )
                
                if should_promote:
                    # Save and promote
                    logger.info(f"Promoting {model_type} model: {reason}")
                    version = self.registry.save_model(
                        model=model,
                        model_name=model_name,
                        metrics={**metrics, **candidate_metrics},
                        params=params
                    )
                    
                    if version:
                        # Transition to champion
                        self.registry._client.transition_model_version_stage(
                            name=model_name,
                            version=version,
                            stage="Champion"
                        )
                        
                        # Archive old champion
                        try:
                            self.registry._client.transition_model_version_stage(
                                name=model_name,
                                version=champion_version.version,
                                stage="Archived"
                            )
                        except Exception as e:
                            logger.warning(f"Could not archive old champion: {e}")
                        
                        return {
                            "promoted": True,
                            "reason": reason,
                            "version": version,
                            "candidate_metrics": candidate_metrics,
                            "champion_metrics": champion_metrics,
                            "improvement": {
                                "mase": ((champion_metrics.get("mase", 0) - candidate_metrics.get("mase", 0)) / champion_metrics.get("mase", 1)) * 100,
                                "rmse": ((champion_metrics.get("rmse", 0) - candidate_metrics.get("rmse", 0)) / champion_metrics.get("rmse", 1)) * 100
                            }
                        }
                    else:
                        return {
                            "promoted": False,
                            "reason": "Failed to save model to registry"
                        }
                else:
                    logger.info(f"Not promoting {model_type} model: {reason}")
                    return {
                        "promoted": False,
                        "reason": reason,
                        "candidate_metrics": candidate_metrics,
                        "champion_metrics": champion_metrics
                    }
                    
            except Exception as e:
                logger.error(f"Error during promotion evaluation: {e}", exc_info=True)
                return {
                    "promoted": False,
                    "reason": f"Error during evaluation: {str(e)}"
                }
                
        except Exception as e:
            logger.error(f"Error evaluating model for promotion: {e}", exc_info=True)
            return {
                "promoted": False,
                "reason": f"Error in backtesting: {str(e)}"
            }


# Global promoter instance
_promoter_instance: Optional[SafeModelPromoter] = None

def get_promoter() -> SafeModelPromoter:
    """Get global safe model promoter instance"""
    global _promoter_instance
    if _promoter_instance is None:
        _promoter_instance = SafeModelPromoter()
    return _promoter_instance

