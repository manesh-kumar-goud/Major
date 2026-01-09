"""
ML utilities for data preprocessing
"""
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def preprocess_data(data, feature_range=(0, 1)):
    """Preprocess stock data using Min-Max scaling"""
    try:
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        scaler = MinMaxScaler(feature_range=feature_range)
        scaled_data = scaler.fit_transform(data)
        
        return scaled_data.flatten(), scaler
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return data, None

def create_sequences(data, sequence_length=60):
    """Create sequences for time series prediction"""
    try:
        X, y = [], []
        
        for i in range(sequence_length, len(data)):
            X.append(data[i-sequence_length:i])
            y.append(data[i])
        
        return np.array(X), np.array(y)
    except Exception as e:
        print(f"Error creating sequences: {e}")
        return np.array([]), np.array([])

def inverse_transform(scaled_data, scaler):
    """Convert scaled data back to original scale"""
    try:
        if scaler is None:
            return scaled_data
        
        if len(scaled_data.shape) == 1:
            scaled_data = scaled_data.reshape(-1, 1)
        
        return scaler.inverse_transform(scaled_data)
    except Exception as e:
        print(f"Error in inverse transform: {e}")
        return scaled_data



