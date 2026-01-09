"""
Next-Generation Time Series Models for StockNeuro
"""
# Import base models from parent module (ml/models.py)
# Use importlib to avoid circular import (ml/models.py vs ml/models/__init__.py)
import importlib.util
import os

# Get the path to the parent models.py file
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models_file = os.path.join(parent_dir, 'models.py')

# Load the models.py module directly
spec = importlib.util.spec_from_file_location("ml_models_base", models_file)
ml_models_base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ml_models_base)

# Import the classes
LSTMModel = ml_models_base.LSTMModel
RNNModel = ml_models_base.RNNModel
BaseModel = ml_models_base.BaseModel

# Try to import next-gen models
try:
    from ml.models.patchtst import PatchTSTModel, create_patchtst_model
    PATCHTST_AVAILABLE = True
except ImportError:
    PATCHTST_AVAILABLE = False
    PatchTSTModel = None
    create_patchtst_model = None

try:
    from ml.models.chronos import ChronosModel, create_chronos_model
    CHRONOS_AVAILABLE = True
except ImportError:
    CHRONOS_AVAILABLE = False
    ChronosModel = None
    create_chronos_model = None

try:
    from ml.models.mamba import MambaModel, create_mamba_model
    MAMBA_AVAILABLE = True
except ImportError:
    MAMBA_AVAILABLE = False
    MambaModel = None
    create_mamba_model = None

__all__ = [
    'LSTMModel',
    'RNNModel', 
    'BaseModel',
    'PATCHTST_AVAILABLE',
    'CHRONOS_AVAILABLE',
    'MAMBA_AVAILABLE'
]

if PATCHTST_AVAILABLE:
    __all__.extend(['PatchTSTModel', 'create_patchtst_model'])

if CHRONOS_AVAILABLE:
    __all__.extend(['ChronosModel', 'create_chronos_model'])

if MAMBA_AVAILABLE:
    __all__.extend(['MambaModel', 'create_mamba_model'])

