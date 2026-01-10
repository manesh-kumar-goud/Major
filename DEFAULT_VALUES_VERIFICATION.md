# ✅ Default Values Verification - LSTM & RNN

## Backend Defaults (Verified):

### Model Architecture:
- **LSTM Default**: `units=256`, `dropout=0.2`, `use_stacked=True`
- **RNN Default**: `units=256`, `dropout=0.2`
- **Default Model Type**: `"LSTM"` (in PredictionRequest)

### Training Hyperparameters:
- **Epochs**: `100`
- **Batch Size**: `32`
- **Learning Rate**: `0.0008`
- **Sequence Length (Lookback)**: `60`

### API Defaults:
- **Period**: `"3y"` (3 years)
- **Prediction Days**: `30`

## Frontend Defaults (Now Corrected):

### ✅ Matches Backend:
- **Model**: `"LSTM"` ✅ (was "Both", now matches backend)
- **Period**: `"3y"` ✅ (was "3mo", now matches backend)
- **Epochs**: `100` ✅
- **Batch Size**: `32` ✅
- **Lookback**: `60` ✅

## Summary:

**All frontend defaults now correctly match backend defaults!**

The defaults are optimized for:
- **Higher accuracy** (100 epochs, 3 years of data)
- **Better model architecture** (256 units, stacked LSTM)
- **Optimal training** (learning rate 0.0008)

These defaults are designed to achieve **80% accuracy target**.



