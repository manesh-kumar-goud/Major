"""
Load-Once Model Caching System for StockNeuro
Implements model warmup, caching, and hot-swap capabilities
"""
import threading
import logging
from typing import Dict, Optional, Any, List, Tuple
from datetime import datetime

from ml.model_registry import get_registry
from ml.models import LSTMModel, RNNModel
from core.config import settings

logger = logging.getLogger("stock_forecasting")


class ModelLoader:
    """
    Load-once model cache with hot-swap support
    Models are loaded once and cached in-memory for fast inference
    """
    
    def __init__(self):
        self._model_cache: Dict[str, Any] = {}  # { "model_type@alias": model_instance }
        self._lock = threading.Lock()
        self._registry = get_registry() if settings.MLFLOW_ENABLED else None
        self._warmup_complete = False
        
    def get_model(
        self, 
        model_type: str, 
        alias_or_version: str = "champion",
        fallback_to_new: bool = True
    ) -> Optional[Any]:
        """
        Get model from cache or registry
        
        Args:
            model_type: "LSTM" or "RNN"
            alias_or_version: MLflow alias (e.g., "champion") or version number
            fallback_to_new: If True, create new model if not in registry
        
        Returns:
            Model instance or None
        """
        model_type_upper = model_type.upper()
        cache_key = f"{model_type_upper}@{alias_or_version}"
        
        # Check cache first
        if cache_key in self._model_cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self._model_cache[cache_key]
        
        # Thread-safe loading
        with self._lock:
            # Double-check after acquiring lock
            if cache_key in self._model_cache:
                return self._model_cache[cache_key]
            
            # Try to load from MLflow registry
            if self._registry and settings.MLFLOW_ENABLED:
                model_name = f"StockNeuro_{model_type_upper}"
                try:
                    mlflow_model = self._registry.get_model(model_name, alias_or_version)
                    if mlflow_model:
                        self._model_cache[cache_key] = mlflow_model
                        logger.info(f"Loaded {cache_key} from MLflow registry")
                        return mlflow_model
                except Exception as e:
                    logger.warning(f"Could not load {cache_key} from registry: {e}")
            
            # Fallback: create new model instance (but don't cache it yet - needs training)
            if fallback_to_new:
                logger.info(f"Creating new {model_type_upper} model instance (not yet trained)")
                if model_type_upper == "LSTM":
                    return LSTMModel(units=50)
                elif model_type_upper == "RNN":
                    return RNNModel(units=50)
                else:
                    logger.error(f"Unknown model type: {model_type}")
                    return None
            
            return None
    
    def cache_trained_model(
        self,
        model: Any,
        model_type: str,
        alias: str = "latest",
        metrics: Optional[Dict[str, float]] = None,
        params: Optional[Dict[str, Any]] = None
    ):
        """
        Cache a trained model and optionally save to registry
        
        Args:
            model: Trained model instance
            model_type: "LSTM" or "RNN"
            alias: Cache alias (e.g., "latest", "champion")
            metrics: Model metrics for registry
            params: Model parameters for registry
        """
        model_type_upper = model_type.upper()
        cache_key = f"{model_type_upper}@{alias}"
        
        with self._lock:
            self._model_cache[cache_key] = model
            logger.info(f"Cached trained model: {cache_key}")
            
            # Optionally save to MLflow registry
            if self._registry and settings.MLFLOW_ENABLED and metrics and params:
                model_name = f"StockNeuro_{model_type_upper}"
                try:
                    version = self._registry.save_model(
                        model=model,
                        model_name=model_name,
                        metrics=metrics,
                        params=params
                    )
                    if version:
                        logger.info(f"Saved {cache_key} to registry as version {version}")
                except Exception as e:
                    logger.warning(f"Could not save {cache_key} to registry: {e}")
    
    def warmup(self, models_to_preload: List[Tuple[str, str]] = None):
        """
        Preload models at startup
        
        Args:
            models_to_preload: List of (model_type, alias) tuples to preload
                              Default: [("LSTM", "champion"), ("RNN", "champion")]
        """
        if self._warmup_complete:
            logger.info("Warmup already completed")
            return
        
        if models_to_preload is None:
            models_to_preload = [
                ("LSTM", "champion"),
                ("RNN", "champion")
            ]
        
        logger.info(f"Starting model warmup for {len(models_to_preload)} models...")
        
        for model_type, alias in models_to_preload:
            try:
                model = self.get_model(model_type, alias, fallback_to_new=False)
                if model:
                    logger.info(f"✅ Warmed up {model_type}@{alias}")
                else:
                    logger.warning(f"⚠️ Could not warm up {model_type}@{alias} (not in registry)")
            except Exception as e:
                logger.error(f"❌ Failed to warm up {model_type}@{alias}: {e}")
        
        self._warmup_complete = True
        logger.info("✅ Model warmup complete")
    
    def clear_cache(self, model_type: Optional[str] = None, alias: Optional[str] = None):
        """Clear model cache"""
        with self._lock:
            if model_type and alias:
                cache_key = f"{model_type.upper()}@{alias}"
                if cache_key in self._model_cache:
                    del self._model_cache[cache_key]
                    logger.info(f"Cleared cache for {cache_key}")
            elif model_type:
                keys_to_remove = [k for k in self._model_cache.keys() if k.startswith(f"{model_type.upper()}@")]
                for key in keys_to_remove:
                    del self._model_cache[key]
                logger.info(f"Cleared cache for all {model_type} models")
            else:
                self._model_cache.clear()
                logger.info("Cleared all model cache")
    
    def refresh_model(self, model_type: str, alias: str = "champion"):
        """
        Refresh a model from registry (hot-swap)
        Useful when a new champion is promoted
        """
        model_type_upper = model_type.upper()
        cache_key = f"{model_type_upper}@{alias}"
        
        # Clear old cache
        self.clear_cache(model_type_upper, alias)
        
        # Load new version
        model = self.get_model(model_type_upper, alias, fallback_to_new=False)
        if model:
            logger.info(f"✅ Refreshed {cache_key} from registry")
        else:
            logger.warning(f"⚠️ Could not refresh {cache_key} (not in registry)")
        
        return model
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get status of model cache"""
        return {
            "cached_models": list(self._model_cache.keys()),
            "cache_size": len(self._model_cache),
            "warmup_complete": self._warmup_complete,
            "mlflow_enabled": settings.MLFLOW_ENABLED,
            "registry_available": self._registry is not None
        }


# Global model loader instance
_model_loader_instance: Optional[ModelLoader] = None

def get_model_loader() -> ModelLoader:
    """Get global model loader instance"""
    global _model_loader_instance
    if _model_loader_instance is None:
        _model_loader_instance = ModelLoader()
    return _model_loader_instance














