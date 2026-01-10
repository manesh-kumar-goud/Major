"""
Data Preprocessing Utilities for Next-Gen Models
"""
try:
    from ml.data.patchtst_preprocessing import (
        create_patches,
        reversible_instance_normalization,
        denormalize_revin,
        preprocess_for_patchtst
    )
    PATCHTST_PREPROCESSING_AVAILABLE = True
except ImportError:
    PATCHTST_PREPROCESSING_AVAILABLE = False

__all__ = ['PATCHTST_PREPROCESSING_AVAILABLE']

if PATCHTST_PREPROCESSING_AVAILABLE:
    __all__.extend([
        'create_patches',
        'reversible_instance_normalization',
        'denormalize_revin',
        'preprocess_for_patchtst'
    ])














