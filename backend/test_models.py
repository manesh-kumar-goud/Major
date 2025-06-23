#!/usr/bin/env python3
"""
Test script for the LSTM and RNN models
Run this to verify the models are working correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from models import Model_LSTM, Model_RNN, evaluation

def test_models():
    """Test both LSTM and RNN models with sample data"""
    print("🔍 Testing LSTM and RNN Models")
    print("=" * 50)
    
    # Create sample training data
    np.random.seed(42)  # For reproducible results
    
    # Generate sample time series data
    n_samples = 200
    sequence_length = 60
    
    # Create sample data
    time_series = np.cumsum(np.random.randn(n_samples + sequence_length)) + 100
    
    # Create sequences
    X = []
    y = []
    
    for i in range(len(time_series) - sequence_length):
        X.append(time_series[i:(i + sequence_length)])
        y.append(time_series[i + sequence_length])
    
    X = np.array(X)
    y = np.array(y)
    
    # Split data
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"📊 Training data shape: {X_train.shape}")
    print(f"📊 Test data shape: {X_test.shape}")
    print(f"📊 Training labels shape: {y_train.shape}")
    print(f"📊 Test labels shape: {y_test.shape}")
    
    # Test LSTM Model
    print("\n🤖 Testing LSTM Model...")
    try:
        lstm_metrics, lstm_predictions = Model_LSTM(X_train, y_train, X_test, y_test, sol=20)
        print("✅ LSTM Model working")
        print(f"📈 LSTM Metrics: {lstm_metrics}")
        print(f"📊 LSTM Predictions shape: {lstm_predictions.shape}")
    except Exception as e:
        print(f"❌ LSTM Model error: {e}")
    
    # Test RNN Model
    print("\n🤖 Testing RNN Model...")
    try:
        rnn_metrics, rnn_predictions = Model_RNN(X_train, y_train, X_test, y_test, sol=[20, 10])
        print("✅ RNN Model working")
        print(f"📈 RNN Metrics: {rnn_metrics}")
        print(f"📊 RNN Predictions shape: {rnn_predictions.shape}")
    except Exception as e:
        print(f"❌ RNN Model error: {e}")
    
    # Test evaluation function
    print("\n📊 Testing Evaluation Function...")
    try:
        sample_actual = np.array([1, 2, 3, 4, 5])
        sample_predicted = np.array([1.1, 2.2, 2.9, 4.1, 4.8])
        eval_result = evaluation(sample_actual, sample_predicted)
        print("✅ Evaluation function working")
        print(f"📈 Sample evaluation: {eval_result}")
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Model testing completed!")

if __name__ == "__main__":
    test_models() 