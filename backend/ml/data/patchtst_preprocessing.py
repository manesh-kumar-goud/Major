"""
PatchTST Data Preprocessing
Implements patching mechanism and Reversible Instance Normalization (ReVIN)
"""
import numpy as np
from typing import Tuple, Optional
import logging

logger = logging.getLogger("stock_forecasting")


def create_patches(
    data: np.ndarray,
    patch_len: int = 16,
    stride: int = 8
) -> Tuple[np.ndarray, int]:
    """
    Create patches from time series data
    
    Args:
        data: Time series data (sequence_length,)
        patch_len: Length of each patch
        stride: Stride between patches
    
    Returns:
        Tuple of (patches, num_patches)
        patches: (num_patches, patch_len)
    """
    sequence_length = len(data)
    
    if sequence_length < patch_len:
        # Pad if sequence is shorter than patch length
        padding = patch_len - sequence_length
        data = np.pad(data, (0, padding), mode='edge')
        sequence_length = len(data)
    
    # Calculate number of patches
    num_patches = (sequence_length - patch_len) // stride + 1
    
    # Create patches
    patches = []
    for i in range(num_patches):
        start_idx = i * stride
        end_idx = start_idx + patch_len
        if end_idx <= sequence_length:
            patches.append(data[start_idx:end_idx])
    
    if len(patches) == 0:
        # Fallback: single patch
        patches = [data[:patch_len]]
        num_patches = 1
    
    patches_array = np.array(patches)
    
    logger.debug(
        f"Created {num_patches} patches from sequence of length {sequence_length}: "
        f"patch_len={patch_len}, stride={stride}"
    )
    
    return patches_array, num_patches


def reversible_instance_normalization(
    data: np.ndarray,
    eps: float = 1e-5
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Reversible Instance Normalization (ReVIN)
    Normalizes each instance independently and stores statistics for denormalization
    
    Args:
        data: Time series data (n_samples, sequence_length) or (sequence_length,)
        eps: Small value to prevent division by zero
    
    Returns:
        Tuple of (normalized_data, normalization_stats)
        normalization_stats: (mean, std) for each instance
    """
    original_shape = data.shape
    
    # Flatten to 2D if needed
    if data.ndim == 1:
        data = data.reshape(1, -1)
    
    n_samples, seq_len = data.shape
    
    # Calculate instance-wise statistics
    means = np.mean(data, axis=1, keepdims=True)
    stds = np.std(data, axis=1, keepdims=True) + eps
    
    # Normalize
    normalized = (data - means) / stds
    
    # Store stats for denormalization
    stats = {
        'mean': means,
        'std': stds
    }
    
    # Reshape to original if needed
    if len(original_shape) == 1:
        normalized = normalized.flatten()
    
    logger.debug(f"Applied ReVIN: shape {original_shape} -> {normalized.shape}")
    
    return normalized, stats


def denormalize_revin(
    normalized_data: np.ndarray,
    stats: dict
) -> np.ndarray:
    """
    Denormalize data using ReVIN statistics
    
    Args:
        normalized_data: Normalized data
        stats: Normalization statistics from reversible_instance_normalization
    
    Returns:
        Denormalized data
    """
    original_shape = normalized_data.shape
    
    # Flatten to 2D if needed
    if normalized_data.ndim == 1:
        normalized_data = normalized_data.reshape(1, -1)
    
    means = stats['mean']
    stds = stats['std']
    
    # Denormalize
    denormalized = normalized_data * stds + means
    
    # Reshape to original if needed
    if len(original_shape) == 1:
        denormalized = denormalized.flatten()
    
    return denormalized


def preprocess_for_patchtst(
    data: np.ndarray,
    patch_len: int = 16,
    stride: int = 8,
    use_revin: bool = True
) -> Tuple[np.ndarray, dict]:
    """
    Complete preprocessing pipeline for PatchTST
    
    Args:
        data: Raw time series data (sequence_length,) or (n_samples, sequence_length)
        patch_len: Patch length
        stride: Stride between patches
        use_revin: Whether to apply ReVIN
    
    Returns:
        Tuple of (processed_data, preprocessing_info)
        preprocessing_info: Dictionary with normalization stats and patch info
    """
    info = {}
    
    # Apply ReVIN if requested
    if use_revin:
        normalized, stats = reversible_instance_normalization(data)
        info['revin_stats'] = stats
        info['revin_applied'] = True
    else:
        normalized = data.copy()
        info['revin_applied'] = False
    
    # Create patches
    if normalized.ndim == 1:
        patches, num_patches = create_patches(normalized, patch_len, stride)
        info['num_patches'] = num_patches
        info['patch_len'] = patch_len
        info['stride'] = stride
        return patches, info
    else:
        # Process each sample independently (Channel Independence)
        all_patches = []
        for i in range(normalized.shape[0]):
            sample_patches, num_patches = create_patches(
                normalized[i], patch_len, stride
            )
            all_patches.append(sample_patches)
        
        info['num_patches'] = num_patches
        info['patch_len'] = patch_len
        info['stride'] = stride
        
        return np.array(all_patches), info














