"""
Tests for load-once model caching and auto-learning
"""
import pytest
import numpy as np
from ml.model_loader import get_model_loader
from ml.auto_learning import get_brain
from ml.safe_promotion import get_promoter


def test_model_loader_initialization():
    """Test model loader initialization"""
    loader = get_model_loader()
    assert loader is not None
    assert loader._warmup_complete is False


def test_model_loader_get_model():
    """Test getting model from loader"""
    loader = get_model_loader()
    
    # Get LSTM model (should create new if not cached)
    model = loader.get_model("LSTM", "champion", fallback_to_new=True)
    assert model is not None
    
    # Get same model again (should be cached)
    model2 = loader.get_model("LSTM", "champion", fallback_to_new=True)
    assert model2 is not None


def test_model_loader_cache_status():
    """Test cache status reporting"""
    loader = get_model_loader()
    status = loader.get_cache_status()
    
    assert "cached_models" in status
    assert "cache_size" in status
    assert "warmup_complete" in status
    assert isinstance(status["cached_models"], list)


def test_auto_learning_brain_initialization():
    """Test auto-learning brain initialization"""
    brain = get_brain()
    assert brain is not None


def test_auto_learning_suggest_hyperparameters():
    """Test hyperparameter suggestions"""
    brain = get_brain()
    
    suggestions = brain.suggest_hyperparameters(
        model_type="LSTM",
        data_size=1000
    )
    
    assert "units" in suggestions
    assert "epochs" in suggestions
    assert "batch_size" in suggestions
    assert "learning_rate" in suggestions
    assert suggestions["epochs"] > 0
    assert suggestions["batch_size"] > 0


def test_safe_promoter_initialization():
    """Test safe promoter initialization"""
    promoter = get_promoter()
    assert promoter is not None
    assert promoter.promotion_threshold == 0.05  # 5%


def test_safe_promoter_should_promote():
    """Test promotion decision logic"""
    promoter = get_promoter()
    
    # Candidate is significantly better
    candidate_metrics = {"mase": 0.8, "rmse": 0.02, "smape": 5.0}
    champion_metrics = {"mase": 1.0, "rmse": 0.025, "smape": 6.0}
    
    should_promote, reason = promoter.should_promote(
        candidate_metrics,
        champion_metrics
    )
    
    assert should_promote is True
    assert "improved" in reason.lower()
    
    # Candidate is not better enough
    candidate_metrics = {"mase": 0.98, "rmse": 0.024, "smape": 5.9}
    champion_metrics = {"mase": 1.0, "rmse": 0.025, "smape": 6.0}
    
    should_promote, reason = promoter.should_promote(
        candidate_metrics,
        champion_metrics
    )
    
    assert should_promote is False
    assert "threshold" in reason.lower() or "below" in reason.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])














