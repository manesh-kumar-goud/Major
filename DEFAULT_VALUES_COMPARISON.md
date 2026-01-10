# Default Values Comparison: Frontend vs Backend

## Current Status

### Backend Defaults (Actual):
- **Model**: `"LSTM"` (in `PredictionRequest`)
- **Period**: `"3y"` (3 years)
- **Epochs**: `100`
- **Batch Size**: `32`
- **Learning Rate**: `0.0008`
- **Sequence Length (Lookback)**: `60` (from config)
- **LSTM Units**: `256`
- **LSTM Dropout**: `0.2`
- **LSTM Stacked**: `True`
- **RNN Units**: `256`
- **RNN Dropout**: `0.2`

### Frontend Defaults (Current):
- **Model**: `"Both"` ❌ (Backend default is `"LSTM"`)
- **Period**: `"3mo"` ❌ (Backend default is `"3y"`)
- **Epochs**: `100` ✅
- **Batch Size**: `32` ✅
- **Lookback**: `60` ✅

## Issues Found:

1. **Model Default**: Frontend uses `"Both"` but backend API default is `"LSTM"`
2. **Period Default**: Frontend uses `"3mo"` but backend default is `"3y"`

## Recommendation:

Update frontend defaults to match backend for consistency.



