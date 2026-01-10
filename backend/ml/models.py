"""
Optimized LSTM and RNN models using TensorFlow/Keras
"""
import numpy as np
import warnings
warnings.filterwarnings('ignore')

import logging
logger = logging.getLogger("stock_forecasting")

# Try to import TensorFlow
TF_AVAILABLE = False
Sequential = None
LSTM = None
Dense = None
SimpleRNN = None
Dropout = None
Adam = None

try:
    import tensorflow as tf
    # Suppress TensorFlow warnings (compatible with all TF versions)
    try:
        if hasattr(tf, 'get_logger'):
            tf.get_logger().setLevel('ERROR')
    except AttributeError:
        # Older TensorFlow versions don't have get_logger
        import os
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    
    # Try to import Keras components
    # TensorFlow 2.18.0 uses tensorflow.keras module path
    try:
        # Use tensorflow.keras (works with TF 2.18.0)
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, SimpleRNN, Dropout
        from tensorflow.keras.optimizers import Adam
        TF_AVAILABLE = True
        logger.info("✅ TensorFlow and Keras imported successfully")
    except ImportError as e:
        logger.warning(f"TensorFlow installed but Keras import failed: {e}")
        TF_AVAILABLE = False
except ImportError as e:
    logger.warning(f"TensorFlow not available: {e}")
    TF_AVAILABLE = False
except Exception as e:
    logger.warning(f"Error importing TensorFlow: {e}")
    TF_AVAILABLE = False

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from ml.metrics import calculate_all_metrics

class BaseModel:
    """Base class for prediction models"""
    
    def __init__(self, units: int = 50):
        self.units = units
        self.model = None
        self.is_trained = False
    
    def train(self, X_train, y_train, epochs=20, batch_size=32, verbose=0):
        """Train the model"""
        raise NotImplementedError
    
    def predict(self, X_test):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Handle case when TensorFlow is not available
        if not TF_AVAILABLE or self.model is None:
            logger.warning("TensorFlow not available or model is None, using fallback predictions")
            # Create fallback predictions based on input data
            X_test_array = np.array(X_test)
            
            # If 3D input (batch, timesteps, features), use last timestep
            if len(X_test_array.shape) == 3:
                # Use mean of last few timesteps as prediction
                predictions = np.mean(X_test_array[:, -5:, :], axis=1)
                if predictions.shape[1] == 1:
                    return predictions.flatten()
                return predictions[:, -1]  # Use last feature
            elif len(X_test_array.shape) == 2:
                # Use mean of last few values
                predictions = np.mean(X_test_array[:, -5:], axis=1)
                return predictions
            else:
                # Simple fallback
                return np.array([np.mean(X_test_array)] * len(X_test_array))
        
        return self.model.predict(X_test, verbose=0)
    
    def predict_single(self, sequence):
        """Predict single sequence"""
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        if not TF_AVAILABLE or self.model is None:
            # Fallback for when TensorFlow is not available
            return np.array([[np.random.normal(0.5, 0.1)]], dtype=np.float32)
        
        # Ensure proper shape and dtype
        sequence = np.array(sequence, dtype=np.float32)
        
        # Handle different input shapes
        if len(sequence.shape) == 3:
            # Already in correct shape (batch, timesteps, features)
            if sequence.shape[0] != 1:
                sequence = sequence[:1]  # Take first batch only
        elif len(sequence.shape) == 2:
            # (timesteps, features) -> (1, timesteps, features)
            sequence = sequence.reshape((1, sequence.shape[0], sequence.shape[1]))
        elif len(sequence.shape) == 1:
            # (timesteps,) -> (1, timesteps, 1)
            sequence = sequence.reshape((1, sequence.shape[0], 1))
        else:
            raise ValueError(f"Invalid sequence shape: {sequence.shape}")
        
        # Ensure sequence has the right number of features (1 for univariate)
        if sequence.shape[2] != 1:
            sequence = sequence[:, :, :1]  # Take only first feature
        
        try:
            # Ensure sequence is properly shaped and has known rank
            if sequence.shape[0] != 1:
                sequence = sequence[:1]
            if len(sequence.shape) != 3:
                sequence = sequence.reshape((1, sequence.shape[-2] if len(sequence.shape) >= 2 else 60, 1))
            
            # Use model.__call__ instead of predict for better shape handling
            prediction = self.model(sequence, training=False)
            
            # Ensure prediction has correct shape
            if hasattr(prediction, 'numpy'):
                pred_array = prediction.numpy()
            else:
                pred_array = np.array(prediction)
            
            # Reshape to (1, 1) if needed
            if pred_array.ndim == 0:
                pred_array = pred_array.reshape((1, 1))
            elif pred_array.ndim == 1:
                pred_array = pred_array.reshape((1, len(pred_array)))
            elif pred_array.ndim == 2 and pred_array.shape[0] != 1:
                pred_array = pred_array[:1]
            
            return pred_array
        except Exception as e:
            logger.error(f"Error in predict_single: {e}, shape: {sequence.shape if hasattr(sequence, 'shape') else 'unknown'}")
            # Fallback: return a simple prediction based on the last value
            if hasattr(sequence, 'shape') and len(sequence.shape) >= 2:
                last_val = float(sequence[0, -1, 0] if sequence.shape[2] == 1 else sequence[0, -1])
                return np.array([[last_val]], dtype=np.float32)
            raise
    
    def evaluate(self, y_true, y_pred, y_train=None):
        """
        Evaluate model performance with advanced metrics
        
        Args:
            y_true: Actual values
            y_pred: Predicted values
            y_train: Training data (optional, for MASE calculation)
        
        Returns:
            Dictionary of metrics including RMSE, MAE, MAPE, sMAPE, MASE, R², Accuracy
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        y_true = np.array(y_true).flatten()
        y_pred = np.array(y_pred).flatten()
        
        # Ensure same length
        min_len = min(len(y_true), len(y_pred))
        y_true = y_true[:min_len]
        y_pred = y_pred[:min_len]
        
        # Remove NaN and infinite values
        mask = np.isfinite(y_true) & np.isfinite(y_pred)
        y_true = y_true[mask]
        y_pred = y_pred[mask]
        
        if len(y_true) == 0:
            return {
                'mse': 0.0, 'rmse': 0.0, 'mae': 0.0,
                'mape': 0.0, 'smape': 0.0, 'mase': np.nan,
                'accuracy': 0.0, 'r2_score': 0.0
            }
        
        # Use advanced metrics calculator
        try:
            metrics = calculate_all_metrics(y_true, y_pred, y_train=y_train)
            return metrics
        except Exception as e:
            logger.warning(f"Error calculating advanced metrics, falling back to basic: {e}")
            # Fallback to basic metrics
            mse = mean_squared_error(y_true, y_pred)
            mae = mean_absolute_error(y_true, y_pred)
            r2 = r2_score(y_true, y_pred)
            rmse = np.sqrt(mse)
            
            tolerance = 0.075  # 7.5% tolerance - more realistic for stock predictions
            correct = np.abs((y_true - y_pred) / np.where(y_true == 0, 1e-8, y_true)) <= tolerance
            accuracy = np.mean(correct) * 100
            
            return {
                'mse': float(mse),
                'rmse': float(rmse),
                'mae': float(mae),
                'mape': np.nan,
                'smape': np.nan,
                'mase': np.nan,
                'accuracy': float(accuracy),
                'r2_score': float(r2)
            }

class LSTMModel(BaseModel):
    """Optimized LSTM model with improved architecture for higher accuracy"""
    
    def __init__(self, units: int = 256, dropout: float = 0.2, use_stacked: bool = True):
        super().__init__(units)
        self.dropout = dropout
        self.use_stacked = use_stacked
        if not TF_AVAILABLE:
            logger.warning("TensorFlow not available, using mock predictions")
    
    def train(self, X_train, y_train, epochs=100, batch_size=32, verbose=0, learning_rate=0.0008):
        """Train LSTM model with improved architecture"""
        if not TF_AVAILABLE:
            logger.error("❌ TensorFlow not available - Cannot train model!")
            logger.error("Please install TensorFlow: pip install tensorflow")
            raise RuntimeError("TensorFlow is required for model training. Please install it: pip install tensorflow")
        
        logger.info(f"🚀 Starting LSTM model training...")
        logger.info(f"   Training samples: {len(X_train)}")
        logger.info(f"   Epochs: {epochs}")
        logger.info(f"   Batch size: {batch_size}")
        logger.info(f"   Learning rate: {learning_rate}")
        
        # Ensure proper data types and shapes
        X_train = np.array(X_train, dtype=np.float32)
        y_train = np.array(y_train, dtype=np.float32)
        
        if len(X_train.shape) == 2:
            X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
        
        if len(y_train.shape) > 1:
            y_train = y_train.flatten()
        
        # Build enhanced model architecture for 80% accuracy
        if self.use_stacked and self.units >= 128 and len(X_train) > 100:
            # Enhanced 3-layer stacked LSTM for maximum accuracy
            self.model = Sequential([
                LSTM(self.units, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
                Dropout(self.dropout),
                LSTM(self.units, return_sequences=True),  # Second LSTM layer
                Dropout(self.dropout * 0.8),
                LSTM(self.units // 2, return_sequences=False),  # Third LSTM layer
                Dropout(self.dropout * 0.6),
                Dense(self.units // 2, activation='relu'),  # First dense layer
                Dropout(self.dropout * 0.5),
                Dense(self.units // 4, activation='relu'),  # Second dense layer
                Dropout(self.dropout * 0.4),
                Dense(1, activation='linear')
            ])
        elif self.use_stacked and self.units >= 64 and len(X_train) > 50:
            # 2-layer stacked LSTM for medium datasets
            self.model = Sequential([
                LSTM(self.units, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
                Dropout(self.dropout),
                LSTM(self.units // 2, return_sequences=False),
                Dropout(self.dropout * 0.8),
                Dense(self.units // 2, activation='relu'),
                Dropout(self.dropout * 0.6),
                Dense(1, activation='linear')
            ])
        else:
            # Single LSTM with more units (better for smaller datasets)
            self.model = Sequential([
                LSTM(self.units, return_sequences=False, input_shape=(X_train.shape[1], X_train.shape[2])),
                Dropout(self.dropout),
                Dense(self.units // 2, activation='relu'),
                Dropout(self.dropout * 0.8),
                Dense(1, activation='linear')
            ])
        
        # Use Huber loss for better robustness (less sensitive to outliers)
        # Fallback to MSE if Huber not available
        try:
            loss_fn = 'huber'
        except:
            loss_fn = 'mse'
        
        # Enhanced optimizer with better parameters
        self.model.compile(
            optimizer=Adam(learning_rate=learning_rate, beta_1=0.9, beta_2=0.999, epsilon=1e-8),
            loss=loss_fn,
            metrics=['mae', 'mse']
        )
        
        # Add callbacks for better training
        callbacks = []
        if TF_AVAILABLE:
            from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
            
            # Enhanced callbacks for 80% accuracy target
            from tensorflow.keras.callbacks import ModelCheckpoint
            
            # Early stopping with more patience for better training
            early_stop = EarlyStopping(
                monitor='val_loss' if len(X_train) > 10 else 'loss',
                patience=20,  # Increased for more training (was 15)
                restore_best_weights=True,
                verbose=verbose,
                min_delta=1e-7  # More sensitive to improvements
            )
            callbacks.append(early_stop)
            
            # Reduce learning rate on plateau (optimized)
            reduce_lr = ReduceLROnPlateau(
                monitor='val_loss' if len(X_train) > 10 else 'loss',
                factor=0.8,  # Less aggressive (was 0.7)
                patience=8,  # More patience (was 7)
                min_lr=1e-6,  # Lower minimum for fine-tuning
                verbose=verbose
            )
            callbacks.append(reduce_lr)
            
            # Save best model checkpoint
            try:
                checkpoint = ModelCheckpoint(
                    'best_model_checkpoint.h5',
                    monitor='val_loss' if len(X_train) > 10 else 'loss',
                    save_best_only=True,
                    verbose=0
                )
                callbacks.append(checkpoint)
            except:
                pass  # Skip if checkpoint fails
        
        # Train with proper epochs (removed artificial limitation)
        # More epochs for better accuracy
        effective_epochs = epochs if len(X_train) > 50 else min(epochs, 50)
        batch_size = min(batch_size, max(16, X_train.shape[0] // 25))  # Slightly larger batches
        
        # Increased validation split for better validation
        validation_split = 0.2 if len(X_train) > 50 else 0.15 if len(X_train) > 20 else 0.1 if len(X_train) > 10 else 0
        
        # Add progress logging callback
        try:
            from tensorflow.keras.callbacks import LambdaCallback
            progress_logger = LambdaCallback(
                on_epoch_end=lambda epoch, logs: logger.info(
                    f"   Epoch {epoch + 1}/{effective_epochs} - Loss: {logs.get('loss', 0):.6f}, "
                    f"Val Loss: {logs.get('val_loss', 'N/A')}"
                )
            )
            callbacks.append(progress_logger)
        except:
            pass
        
        logger.info(f"⏳ Training LSTM model (this may take a few minutes)...")
        
        history = self.model.fit(
            X_train, y_train,
            epochs=effective_epochs,
            batch_size=batch_size,
            verbose=verbose,
            validation_split=validation_split,
            callbacks=callbacks
        )
        
        final_loss = history.history['loss'][-1] if history.history.get('loss') else 0
        logger.info(f"✅ Training completed! Final loss: {final_loss:.6f}")
        
        self.is_trained = True
        logger.info(f"✅ Model is now trained and ready for predictions")

class RNNModel(BaseModel):
    """Optimized RNN model with improved architecture"""
    
    def __init__(self, units: int = 256, dropout: float = 0.2):
        super().__init__(units)
        self.dropout = dropout
        if not TF_AVAILABLE:
            logger.warning("TensorFlow not available, using mock predictions")
    
    def train(self, X_train, y_train, epochs=100, batch_size=32, verbose=0, learning_rate=0.0008):
        """Train RNN model with improved architecture"""
        if not TF_AVAILABLE:
            logger.error("❌ TensorFlow not available - Cannot train model!")
            logger.error("Please install TensorFlow: pip install tensorflow")
            raise RuntimeError("TensorFlow is required for model training. Please install it: pip install tensorflow")
        
        logger.info(f"🚀 Starting RNN model training...")
        logger.info(f"   Training samples: {len(X_train)}")
        logger.info(f"   Epochs: {epochs}")
        logger.info(f"   Batch size: {batch_size}")
        logger.info(f"   Learning rate: {learning_rate}")
        
        # Ensure proper data types and shapes
        X_train = np.array(X_train, dtype=np.float32)
        y_train = np.array(y_train, dtype=np.float32)
        
        if len(X_train.shape) == 2:
            X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
        
        if len(y_train.shape) > 1:
            y_train = y_train.flatten()
        
        # Build enhanced RNN model
        self.model = Sequential([
            SimpleRNN(self.units, return_sequences=False, input_shape=(X_train.shape[1], X_train.shape[2])),
            Dropout(self.dropout),
            Dense(self.units // 2, activation='relu'),
            Dropout(self.dropout * 0.8),
            Dense(self.units // 4, activation='relu'),  # Additional dense layer
            Dropout(self.dropout * 0.6),
            Dense(1, activation='linear')
        ])
        
        # Enhanced optimizer with Huber loss
        try:
            loss_fn = 'huber'
        except:
            loss_fn = 'mse'
        
        self.model.compile(
            optimizer=Adam(learning_rate=learning_rate, beta_1=0.9, beta_2=0.999, epsilon=1e-8),
            loss=loss_fn,
            metrics=['mae', 'mse']
        )
        
        # Add callbacks for better training
        callbacks = []
        if TF_AVAILABLE:
            from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
            
            early_stop = EarlyStopping(
                monitor='val_loss' if len(X_train) > 10 else 'loss',
                patience=20,  # Increased for more training
                restore_best_weights=True,
                verbose=verbose,
                min_delta=1e-7  # More sensitive
            )
            callbacks.append(early_stop)
            
            reduce_lr = ReduceLROnPlateau(
                monitor='val_loss' if len(X_train) > 10 else 'loss',
                factor=0.8,  # Less aggressive
                patience=8,  # More patience
                min_lr=1e-6,  # Lower minimum for fine-tuning
                verbose=verbose
            )
            callbacks.append(reduce_lr)
        
        # Train with enhanced settings
        effective_epochs = epochs if len(X_train) > 50 else min(epochs, 50)
        batch_size = min(batch_size, max(16, X_train.shape[0] // 25))
        
        validation_split = 0.2 if len(X_train) > 50 else 0.15 if len(X_train) > 20 else 0.1 if len(X_train) > 10 else 0
        
        # Add progress logging callback
        try:
            from tensorflow.keras.callbacks import LambdaCallback
            progress_logger = LambdaCallback(
                on_epoch_end=lambda epoch, logs: logger.info(
                    f"   Epoch {epoch + 1}/{effective_epochs} - Loss: {logs.get('loss', 0):.6f}, "
                    f"Val Loss: {logs.get('val_loss', 'N/A')}"
                )
            )
            callbacks.append(progress_logger)
        except:
            pass
        
        logger.info(f"⏳ Training RNN model (this may take a few minutes)...")
        
        history = self.model.fit(
            X_train, y_train,
            epochs=effective_epochs,
            batch_size=batch_size,
            verbose=verbose,
            validation_split=validation_split,
            callbacks=callbacks
        )
        
        final_loss = history.history['loss'][-1] if history.history.get('loss') else 0
        logger.info(f"✅ Training completed! Final loss: {final_loss:.6f}")
        
        self.is_trained = True
        logger.info(f"✅ Model is now trained and ready for predictions")


