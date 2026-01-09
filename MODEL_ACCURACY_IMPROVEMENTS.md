# Model Accuracy Improvements Guide

## Current Status
- **Current Accuracy**: 48.95%
- **Target**: Significantly higher accuracy (70%+)

## Key Issues Fixed

### 1. **Epoch Limitation Bug** ✅ FIXED
**Problem**: The model was artificially limiting epochs to only 10 even when 20+ were requested.
```python
# OLD (WRONG):
epochs = min(epochs, max(5, int(self.units // 5)))  # Limited to 10!

# NEW (CORRECT):
effective_epochs = epochs if len(X_train) > 50 else min(epochs, 30)
```

### 2. **Model Architecture Improvements** ✅ IMPROVED

#### Before:
- Single LSTM layer with 50 units
- Simple Dropout(0.2)
- Single Dense output layer
- No regularization layers

#### After:
- **Stacked LSTM** (2 layers) when units >= 64
- **128 units** (increased from 50)
- **Multiple Dense layers** with ReLU activation
- **Progressive Dropout** (0.3 → 0.21 → 0.15)
- **Better feature extraction**

### 3. **Training Improvements** ✅ ADDED

#### Early Stopping
- Monitors validation loss
- Stops training if no improvement for 10 epochs
- Restores best weights automatically

#### Learning Rate Scheduling
- Reduces learning rate by 50% when loss plateaus
- Minimum learning rate: 1e-6
- Patience: 5 epochs

#### Improved Defaults
- **Epochs**: 50 (was 20)
- **Learning Rate**: 0.0005 (was 0.001) - Lower for better convergence
- **Batch Size**: 32 (unchanged, but better calculated)
- **Validation Split**: 15% (was 10%) for better validation

### 4. **Hyperparameter Changes**

| Parameter | Old Value | New Value | Impact |
|-----------|-----------|-----------|--------|
| Units | 50 | 128 | +156% capacity |
| Epochs | 20 (limited to 10) | 50 | +400% training |
| Learning Rate | 0.001 | 0.0005 | Better convergence |
| Dropout | 0.2 | 0.3 | Better regularization |
| Architecture | Single LSTM | Stacked LSTM | Better feature learning |

## Expected Improvements

### Accuracy Calculation
Accuracy is calculated with **5% tolerance**:
```python
tolerance = 0.05  # 5% tolerance
correct = np.abs((y_true - y_pred) / y_true) <= tolerance
accuracy = np.mean(correct) * 100
```

### Expected Results
- **Before**: 48.95% accuracy
- **Expected After**: 65-75% accuracy (with proper training)
- **Best Case**: 80%+ accuracy (with more data and tuning)

## How to Use

### Automatic (Recommended)
The improvements are **automatically applied** when you:
1. Make a new prediction
2. The model will use the new architecture
3. Training will use improved hyperparameters

### Manual Tuning (Advanced)
If you want to further tune:

```python
# Create model with custom parameters
model = LSTMModel(
    units=256,           # Even more units (slower but more accurate)
    dropout=0.25,        # Lower dropout for more capacity
    use_stacked=True     # Use stacked LSTM
)

# Train with custom hyperparameters
model.train(
    X_train, y_train,
    epochs=100,          # More epochs
    batch_size=16,       # Smaller batches
    learning_rate=0.0003 # Even lower learning rate
)
```

## Additional Recommendations

### 1. **More Training Data**
- Use longer historical periods (2-5 years instead of 1 year)
- More data = better accuracy

### 2. **Feature Engineering**
- Add technical indicators (RSI, MACD, Bollinger Bands)
- Add volume features
- Add market sentiment features

### 3. **Data Preprocessing**
- Better normalization (MinMaxScaler or RobustScaler)
- Handle outliers better
- Add data augmentation

### 4. **Model Ensembling**
- Combine LSTM + RNN predictions
- Use weighted average
- Can improve accuracy by 5-10%

### 5. **Hyperparameter Tuning**
- Use Optuna for automated tuning
- Test different architectures
- Find optimal learning rates per stock

## Monitoring

### Check Training Progress
- Watch validation loss decrease
- Early stopping will prevent overfitting
- Learning rate will adjust automatically

### Metrics to Watch
- **RMSE**: Should decrease (lower is better)
- **MAE**: Should decrease (lower is better)
- **Accuracy**: Should increase (higher is better)
- **R² Score**: Should increase toward 1.0

## Troubleshooting

### If Accuracy Doesn't Improve

1. **Check Data Quality**
   - Ensure sufficient training data (>100 samples)
   - Check for data leakage
   - Verify data preprocessing

2. **Increase Training**
   - Try more epochs (100+)
   - Use smaller learning rate (0.0001)
   - Increase model capacity (256 units)

3. **Feature Engineering**
   - Add more features
   - Use better normalization
   - Handle missing data

4. **Try Different Models**
   - PatchTST (Transformer-based)
   - Chronos (Zero-shot)
   - Ensemble multiple models

## Files Modified

1. `backend/ml/models.py` - Improved LSTM and RNN architectures
2. `backend/services/prediction_service.py` - Updated defaults and hyperparameters

## Next Steps

1. **Test the improvements** by making new predictions
2. **Monitor accuracy** over multiple predictions
3. **Fine-tune** if needed based on results
4. **Consider** using PatchTST or Chronos for even better accuracy

---

**Note**: The improvements are backward compatible. Existing cached models will still work, but new models will use the improved architecture automatically.

