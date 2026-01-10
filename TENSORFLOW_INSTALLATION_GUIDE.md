# TensorFlow Installation Guide

## Issue
TensorFlow is installed but there's a version mismatch with Keras.

## Solution

TensorFlow 2.18.0 is installed and includes Keras 3.5.0+. The code has been updated to use `tf.keras` which is the recommended way for TensorFlow 2.18.0.

## Verification

Run this to verify TensorFlow is working:
```bash
python -c "import tensorflow as tf; from tensorflow import keras; print('TensorFlow:', tf.__version__); print('Keras available:', hasattr(keras, 'Sequential'))"
```

## If Still Having Issues

1. **Uninstall conflicting packages:**
   ```bash
   pip uninstall keras tensorflow tensorflow-intel -y
   ```

2. **Reinstall TensorFlow (includes Keras):**
   ```bash
   pip install tensorflow==2.18.0
   ```

3. **Verify installation:**
   ```bash
   python -c "import tensorflow as tf; print('Success!')"
   ```

## Code Changes Made

Updated `backend/ml/models.py` to use `tf.keras` instead of standalone Keras imports, which is compatible with TensorFlow 2.18.0.



