"""
MLflow Model Registry for StockNeuro
Provides model versioning, caching, and deployment management
"""
import os
import threading
import logging
from typing import Optional, Dict, Any
from datetime import datetime

try:
    import mlflow
    import mlflow.pyfunc
    from mlflow.tracking import MlflowClient
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    mlflow = None
    MlflowClient = None

from core.config import settings

logger = logging.getLogger("stock_forecasting")

class ModelRegistry:
    """MLflow-based model registry with caching"""
    
    def __init__(self):
        self._model_cache: Dict[str, Any] = {}
        self._lock = threading.Lock()
        self._client = None
        
        if MLFLOW_AVAILABLE:
            # Initialize MLflow tracking URI
            mlflow_uri = os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns")
            mlflow.set_tracking_uri(mlflow_uri)
            self._client = MlflowClient(mlflow_uri)
            logger.info(f"MLflow initialized with tracking URI: {mlflow_uri}")
        else:
            logger.warning("MLflow not available. Model registry features will be limited.")
    
    def get_model(
        self, 
        model_name: str, 
        alias_or_version: str = "champion"
    ) -> Optional[Any]:
        """
        Get model from registry with caching
        
        Args:
            model_name: Name of the model in registry (e.g., "StockNeuro_LSTM")
            alias_or_version: Alias like "champion" or specific version number
        
        Returns:
            Loaded model or None if not found
        """
        if not MLFLOW_AVAILABLE:
            logger.warning("MLflow not available. Cannot load from registry.")
            return None
        
        cache_key = f"{model_name}@{alias_or_version}"
        
        # Check cache first
        if cache_key in self._model_cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self._model_cache[cache_key]
        
        # Thread-safe loading
        with self._lock:
            # Double-check after acquiring lock
            if cache_key in self._model_cache:
                return self._model_cache[cache_key]
            
            try:
                # Load from MLflow registry
                model_uri = f"models:/{model_name}/{alias_or_version}"
                logger.info(f"Loading model from registry: {model_uri}")
                model = mlflow.pyfunc.load_model(model_uri)
                
                # Cache the model
                self._model_cache[cache_key] = model
                logger.info(f"Model {cache_key} loaded and cached successfully")
                return model
                
            except Exception as e:
                logger.error(f"Failed to load model {cache_key}: {e}")
                return None
    
    def save_model(
        self,
        model: Any,
        model_name: str,
        metrics: Dict[str, float],
        params: Dict[str, Any],
        signature=None,
        input_example=None,
        model_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Save model to MLflow registry
        
        Args:
            model: The model to save (must be MLflow-compatible)
            model_name: Name for the model in registry
            metrics: Dictionary of metrics to log
            params: Dictionary of parameters to log
            signature: MLflow model signature (optional)
            input_example: Example input for the model (optional)
        
        Returns:
            Model version string if successful, None otherwise
        """
        if not MLFLOW_AVAILABLE:
            logger.warning("MLflow not available. Cannot save to registry.")
            return None
        
        try:
            with mlflow.start_run():
                # Log parameters and metrics
                mlflow.log_params(params)
                mlflow.log_metrics(metrics)
                
                # Handle different model types
                if hasattr(model, 'model') and hasattr(model.model, 'state_dict'):
                    # PyTorch models (PatchTST, etc.)
                    try:
                        import mlflow.pytorch
                        mlflow.pytorch.log_model(
                            pytorch_model=model.model,
                            artifact_path="model",
                            registered_model_name=model_name
                        )
                        model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
                    except Exception as e:
                        logger.warning(f"PyTorch logging failed, using pyfunc: {e}")
                        # Fallback to pyfunc
                        mlflow.pyfunc.log_model(
                            artifact_path="model",
                            python_model=model,
                            signature=signature,
                            input_example=input_example
                        )
                        model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
                elif hasattr(model, 'model') and hasattr(model.model, 'save'):
                    # TensorFlow/Keras models
                    try:
                        import mlflow.tensorflow
                        model.model.save("temp_model")
                        mlflow.tensorflow.log_model(
                            tf_saved_model_dir="temp_model",
                            artifact_path="model",
                            registered_model_name=model_name
                        )
                        model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
                    except Exception as e:
                        logger.warning(f"TensorFlow logging failed, using pyfunc: {e}")
                        mlflow.pyfunc.log_model(
                            artifact_path="model",
                            python_model=model,
                            signature=signature,
                            input_example=input_example
                        )
                        model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
                else:
                    # PyFunc models (default)
                    mlflow.pyfunc.log_model(
                        artifact_path="model",
                        python_model=model,
                        signature=signature,
                        input_example=input_example
                    )
                    model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
                
                # Register model
                mv = mlflow.register_model(model_uri, model_name)
                
                logger.info(f"Model {model_name} registered as version {mv.version}")
                
                # Transition to champion if better than current
                self._promote_to_champion_if_better(model_name, mv.version, metrics)
                
                return mv.version
                
        except Exception as e:
            logger.error(f"Failed to save model {model_name}: {e}", exc_info=True)
            return None
    
    def _promote_to_champion_if_better(
        self, 
        model_name: str, 
        version: str, 
        metrics: Dict[str, float]
    ):
        """Promote model to champion alias if it's better than current champion"""
        try:
            # Get current champion metrics
            try:
                champion = self._client.get_latest_versions(
                    model_name, 
                    stages=["Champion"]
                )
                if champion:
                    champion_run = self._client.get_run(champion[0].run_id)
                    champion_rmse = champion_run.data.metrics.get("rmse", float('inf'))
                    new_rmse = metrics.get("rmse", float('inf'))
                    
                    # If new model is better (lower RMSE), promote it
                    if new_rmse < champion_rmse:
                        self._client.transition_model_version_stage(
                            name=model_name,
                            version=version,
                            stage="Champion"
                        )
                        logger.info(f"Model {model_name} v{version} promoted to Champion")
                        return
            except Exception:
                # No champion yet, promote this one
                pass
            
            # If no champion exists, promote this version
            self._client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage="Champion"
            )
            logger.info(f"Model {model_name} v{version} set as first Champion")
            
        except Exception as e:
            logger.warning(f"Could not promote model to champion: {e}")
    
    def clear_cache(self, model_name: Optional[str] = None):
        """Clear model cache"""
        if model_name:
            # Clear specific model
            keys_to_remove = [k for k in self._model_cache.keys() if k.startswith(f"{model_name}@")]
            for key in keys_to_remove:
                del self._model_cache[key]
            logger.info(f"Cleared cache for {model_name}")
        else:
            # Clear all
            self._model_cache.clear()
            logger.info("Cleared all model cache")
    
    def list_models(self) -> list:
        """List all registered models"""
        if not MLFLOW_AVAILABLE or not self._client:
            return []
        
        try:
            models = self._client.search_registered_models()
            return [
                {
                    "name": m.name,
                    "latest_versions": [
                        {
                            "version": v.version,
                            "stage": v.current_stage,
                            "run_id": v.run_id
                        }
                        for v in m.latest_versions
                    ]
                }
                for m in models
            ]
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []


# Global registry instance
_registry_instance: Optional[ModelRegistry] = None

def get_registry() -> ModelRegistry:
    """Get global model registry instance"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ModelRegistry()
    return _registry_instance

