"""
Unit tests for PatchTST model and preprocessing
"""
import pytest
import numpy as np
from ml.data.patchtst_preprocessing import (
    create_patches,
    reversible_instance_normalization,
    denormalize_revin,
    preprocess_for_patchtst
)


class TestPatchTSTPreprocessing:
    """Test PatchTST preprocessing functions"""
    
    def test_create_patches(self):
        """Test patch creation"""
        data = np.arange(100).astype(float)
        patches, num_patches = create_patches(data, patch_len=16, stride=8)
        
        assert patches.shape[0] == num_patches
        assert patches.shape[1] == 16
        assert num_patches > 0
        
        # Check first patch
        assert np.allclose(patches[0], np.arange(16))
    
    def test_create_patches_short_sequence(self):
        """Test patch creation with short sequence"""
        data = np.arange(10).astype(float)
        patches, num_patches = create_patches(data, patch_len=16, stride=8)
        
        # Should pad and create at least one patch
        assert num_patches >= 1
        assert patches.shape[1] == 16
    
    def test_reversible_instance_normalization(self):
        """Test ReVIN normalization"""
        data = np.random.randn(100) * 10 + 50  # Mean ~50, std ~10
        
        normalized, stats = reversible_instance_normalization(data)
        
        # Check normalization
        assert np.abs(np.mean(normalized)) < 1e-5  # Mean should be ~0
        assert np.abs(np.std(normalized) - 1.0) < 0.1  # Std should be ~1
        
        # Check denormalization
        denormalized = denormalize_revin(normalized, stats)
        assert np.allclose(data, denormalized, rtol=1e-5)
    
    def test_revin_2d(self):
        """Test ReVIN on 2D data"""
        data = np.random.randn(5, 100) * 10 + 50
        
        normalized, stats = reversible_instance_normalization(data)
        
        assert normalized.shape == data.shape
        
        # Denormalize
        denormalized = denormalize_revin(normalized, stats)
        assert np.allclose(data, denormalized, rtol=1e-5)
    
    def test_preprocess_for_patchtst(self):
        """Test complete preprocessing pipeline"""
        data = np.random.randn(200) * 10 + 100
        
        processed, info = preprocess_for_patchtst(
            data,
            patch_len=16,
            stride=8,
            use_revin=True
        )
        
        assert 'revin_applied' in info
        assert 'num_patches' in info
        assert info['revin_applied'] is True
        assert info['num_patches'] > 0
        assert processed.shape[0] == info['num_patches']
    
    def test_preprocess_without_revin(self):
        """Test preprocessing without ReVIN"""
        data = np.random.randn(200) * 10 + 100
        
        processed, info = preprocess_for_patchtst(
            data,
            patch_len=16,
            stride=8,
            use_revin=False
        )
        
        assert info['revin_applied'] is False
        assert 'num_patches' in info


class TestPatchTSTModel:
    """Test PatchTST model (requires neuralforecast)"""
    
    @pytest.mark.skipif(
        True,  # Skip if neuralforecast not available
        reason="NeuralForecast not available"
    )
    def test_patchtst_initialization(self):
        """Test PatchTST model initialization"""
        from ml.models.patchtst import PatchTSTModel
        
        model = PatchTSTModel(
            context_window=60,
            patch_len=16,
            stride=8
        )
        
        assert model.context_window == 60
        assert model.patch_len == 16
        assert model.is_trained is False
    
    @pytest.mark.skipif(
        True,
        reason="NeuralForecast not available"
    )
    def test_patchtst_train_predict(self):
        """Test PatchTST training and prediction"""
        from ml.models.patchtst import PatchTSTModel
        
        # Create dummy data
        n_samples = 50
        seq_len = 60
        X_train = np.random.randn(n_samples, seq_len, 1).astype(np.float32)
        y_train = np.random.randn(n_samples).astype(np.float32)
        
        # Initialize and train
        model = PatchTSTModel(context_window=seq_len)
        model.train(X_train, y_train, epochs=5, verbose=0)
        
        assert model.is_trained is True
        
        # Test prediction
        X_test = np.random.randn(10, seq_len, 1).astype(np.float32)
        predictions = model.predict(X_test)
        
        assert len(predictions) == 10
        assert np.all(np.isfinite(predictions))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])





