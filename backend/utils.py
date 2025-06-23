import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

def preprocess_data(data, feature_range=(0, 1)):
    """
    Preprocess stock data using Min-Max scaling
    
    Args:
        data: Raw stock price data (numpy array or list)
        feature_range: Range for scaling (default: 0 to 1)
    
    Returns:
        scaled_data: Normalized data
        scaler: The scaler object (needed for inverse transform)
    """
    try:
        # Ensure data is 2D
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        scaler = MinMaxScaler(feature_range=feature_range)
        scaled_data = scaler.fit_transform(data)
        
        return scaled_data.flatten(), scaler
    
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return data, None

def create_sequences(data, sequence_length=60):
    """
    Create sequences for time series prediction
    
    Args:
        data: Preprocessed time series data
        sequence_length: Length of each sequence (lookback period)
    
    Returns:
        X: Input sequences
        y: Target values
    """
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
    """
    Convert scaled data back to original scale
    
    Args:
        scaled_data: Scaled predictions or data
        scaler: The scaler used for original transformation
    
    Returns:
        original_scale_data: Data in original scale
    """
    try:
        if scaler is None:
            return scaled_data
        
        # Ensure data is 2D for inverse transform
        if len(scaled_data.shape) == 1:
            scaled_data = scaled_data.reshape(-1, 1)
        
        return scaler.inverse_transform(scaled_data)
    
    except Exception as e:
        print(f"Error in inverse transform: {e}")
        return scaled_data

def prepare_training_data(data, sequence_length=60, test_size=0.2):
    """
    Prepare data for training by creating sequences and splitting
    
    Args:
        data: Raw time series data
        sequence_length: Length of input sequences
        test_size: Proportion of data for testing
    
    Returns:
        Dictionary containing train and test sets
    """
    try:
        # Preprocess data
        scaled_data, scaler = preprocess_data(data)
        
        # Create sequences
        X, y = create_sequences(scaled_data, sequence_length)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, shuffle=False
        )
        
        return {
            'X_train': X_train,
            'X_test': X_test,
            'y_train': y_train,
            'y_test': y_test,
            'scaler': scaler,
            'scaled_data': scaled_data
        }
    
    except Exception as e:
        print(f"Error preparing training data: {e}")
        return None

def calculate_technical_indicators(df):
    """
    Calculate technical indicators for stock data
    
    Args:
        df: DataFrame with OHLCV data
    
    Returns:
        df: DataFrame with additional technical indicators
    """
    try:
        # Simple Moving Averages
        df['SMA_5'] = df['close'].rolling(window=5).mean()
        df['SMA_10'] = df['close'].rolling(window=10).mean()
        df['SMA_20'] = df['close'].rolling(window=20).mean()
        
        # Exponential Moving Average
        df['EMA_12'] = df['close'].ewm(span=12).mean()
        df['EMA_26'] = df['close'].ewm(span=26).mean()
        
        # MACD
        df['MACD'] = df['EMA_12'] - df['EMA_26']
        df['MACD_signal'] = df['MACD'].ewm(span=9).mean()
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        df['BB_middle'] = df['close'].rolling(window=20).mean()
        bb_std = df['close'].rolling(window=20).std()
        df['BB_upper'] = df['BB_middle'] + (bb_std * 2)
        df['BB_lower'] = df['BB_middle'] - (bb_std * 2)
        
        # Volume indicators
        df['volume_sma'] = df['volume'].rolling(window=10).mean()
        
        return df
    
    except Exception as e:
        print(f"Error calculating technical indicators: {e}")
        return df

def validate_stock_data(data):
    """
    Validate stock data for completeness and quality
    
    Args:
        data: Stock data to validate
    
    Returns:
        dict: Validation results
    """
    try:
        if data is None or len(data) == 0:
            return {'valid': False, 'errors': ['No data provided']}
        
        errors = []
        
        # Check for minimum data points
        if len(data) < 100:
            errors.append('Insufficient data points (minimum 100 required)')
        
        # Check for missing values
        if pd.isna(data).any():
            errors.append('Data contains missing values')
        
        # Check for negative prices
        if (data < 0).any():
            errors.append('Data contains negative prices')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'data_points': len(data),
            'date_range': f"{len(data)} data points"
        }
    
    except Exception as e:
        return {
            'valid': False,
            'errors': [f'Validation error: {str(e)}']
        } 