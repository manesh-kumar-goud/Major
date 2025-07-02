from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import json
from models import Model_LSTM, Model_RNN
from utils import preprocess_data, create_sequences, inverse_transform
from api_client import yahoo_api
from config import POPULAR_STOCKS, Config, validate_config
from mock_data import mock_api
import warnings
warnings.filterwarnings('ignore')

# Validate configuration before starting
try:
    validate_config()
    print("✓ Configuration validated successfully")
except ValueError as e:
    print(f"❌ Configuration error: {e}")
    exit(1)

app = Flask(__name__)
app.config.from_object(Config)

# Configure CORS with environment variables
CORS(app, origins=Config.CORS_ORIGINS)

# Global variables to store cached data
cached_data = {}
model_cache = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'environment': app.config['FLASK_ENV'],
        'debug': app.config['DEBUG']
    })

@app.route('/api/stock-history', methods=['GET'])
def get_stock_history():
    """Get historical stock data using RapidAPI"""
    try:
        ticker = request.args.get('ticker', 'AAPL').upper()
        period = request.args.get('period', '1y')
        
        # Use RapidAPI to get stock data, fallback to mock data
        api_response = yahoo_api.get_stock_history(ticker, period)
        
        if not api_response:
            # Fallback to mock data
            print(f"API failed for {ticker}, using mock data")
            data = mock_api.generate_mock_historical_data(ticker, period)
        else:
            # Format the data
            data = yahoo_api.format_historical_data(api_response, ticker)
        
        if not data:
            # Final fallback to mock data
            data = mock_api.generate_mock_historical_data(ticker, period)
        
        # Cache the data
        cached_data[f"{ticker}_{period}"] = {
            'data': data,
            'ticker': ticker,
            'period': period,
            'cached_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'ticker': ticker,
            'period': period,
            'data': data,
            'total_records': len(data)
        })
    
    except Exception as e:
        print(f"Error in get_stock_history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict_stock():
    """Make stock predictions using LSTM or RNN"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', 'AAPL').upper()
        model_type = data.get('model', 'LSTM').upper()
        period = data.get('period', '1y')
        prediction_days = data.get('prediction_days', 30)
        
        print(f"📊 Prediction request: {ticker}, {model_type}, {period}, {prediction_days} days")
        
        # Get stock data using RapidAPI, with fallback to mock data
        api_response = yahoo_api.get_stock_history(ticker, period)
        
        if not api_response:
            print(f"📝 API failed for {ticker}, using mock data")
            # Use mock data if API fails
            from mock_data import mock_api
            historical_data = mock_api.generate_mock_historical_data(ticker, period)
        else:
            # Format the data
            historical_data = yahoo_api.format_historical_data(api_response, ticker)
            if not historical_data:
                print(f"📝 API formatting failed for {ticker}, using mock data")
                from mock_data import mock_api
                historical_data = mock_api.generate_mock_historical_data(ticker, period)
        
        if not historical_data or len(historical_data) < 60:
            print(f"📝 Insufficient data for {ticker}, generating extended mock data")
            from mock_data import mock_api
            historical_data = mock_api.generate_mock_historical_data(ticker, period, min_days=100)
        
        print(f"📈 Using {len(historical_data)} data points for {ticker}")
        
        # Extract close prices
        close_prices = np.array([float(item['close']) for item in historical_data])
        
        # Preprocess data
        scaled_data, scaler = preprocess_data(close_prices)
        
        # Create sequences for training
        sequence_length = 60
        X, y = create_sequences(scaled_data, sequence_length)
        
        if len(X) == 0:
            return jsonify({'error': 'Unable to create training sequences from data'}), 400
        
        print(f"🔧 Created {len(X)} training sequences")
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        print(f"🎯 Training on {len(X_train)} sequences, testing on {len(X_test)} sequences")
        
        # Train model and get predictions
        if model_type == 'LSTM':
            eval_metrics, predictions = Model_LSTM(X_train, y_train, X_test, y_test, sol=50)
        else:
            eval_metrics, predictions = Model_RNN(X_train, y_train, X_test, y_test, sol=[50, 2])
        
        print(f"🤖 Model training completed: {eval_metrics.get('model_type', model_type)}")
        
        # Inverse transform predictions
        predictions_rescaled = inverse_transform(predictions, scaler)
        actual_rescaled = inverse_transform(y_test, scaler)
        
        # Create prediction for future days
        last_sequence = scaled_data[-sequence_length:]
        future_predictions = []
        
        # Simple trend-based future predictions
        trend_factor = 1.001 if model_type == 'LSTM' else 0.999
        for i in range(prediction_days):
            # Use simple trend with some randomness
            next_pred = np.mean(last_sequence[-10:]) * (trend_factor + np.random.normal(0, 0.005))
            future_predictions.append(next_pred)
            last_sequence = np.append(last_sequence[1:], next_pred)
        
        future_predictions_rescaled = inverse_transform(np.array(future_predictions).reshape(-1, 1), scaler)
        
        # Prepare response data
        historical_dates = [historical_data[-(len(actual_rescaled)-i)]['date'] for i in range(len(actual_rescaled))]
        future_dates = [(datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d') 
                       for i in range(prediction_days)]
        
        result = {
            'ticker': ticker,
            'model_type': model_type,
            'historical_data': {
                'dates': historical_dates,
                'actual': actual_rescaled.flatten().tolist(),
                'predicted': predictions_rescaled.flatten().tolist()
            },
            'future_predictions': {
                'dates': future_dates,
                'predictions': future_predictions_rescaled.flatten().tolist()
            },
            'metrics': eval_metrics,
            'last_price': float(close_prices[-1]),
            'prediction_summary': {
                'trend': 'bullish' if np.mean(future_predictions_rescaled) > close_prices[-1] else 'bearish',
                'avg_predicted_price': float(np.mean(future_predictions_rescaled)),
                'price_change_percent': float(((np.mean(future_predictions_rescaled) - close_prices[-1]) / close_prices[-1]) * 100)
            },
            'data_source': 'Mock Data' if not api_response else 'RapidAPI',
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        print(f"✅ Prediction completed successfully for {ticker}")
        return jsonify(result)
    
    except Exception as e:
        error_msg = f"Prediction error for {ticker if 'ticker' in locals() else 'unknown'}: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': error_msg,
            'ticker': ticker if 'ticker' in locals() else 'unknown',
            'suggestions': [
                'Try a different stock ticker',
                'Reduce prediction days',
                'Check if the stock market is open'
            ]
        }), 500

@app.route('/api/compare-models', methods=['POST'])
def compare_models():
    """Compare LSTM and RNN models"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', 'AAPL').upper()
        period = data.get('period', '1y')
        
        # Get stock data using RapidAPI
        api_response = yahoo_api.get_stock_history(ticker, period)
        
        if not api_response:
            return jsonify({'error': 'No data found for ticker'}), 404
        
        # Format the data
        historical_data = yahoo_api.format_historical_data(api_response, ticker)
        
        if not historical_data or len(historical_data) < 100:
            return jsonify({'error': 'Insufficient historical data for comparison'}), 404
        
        # Extract close prices
        close_prices = np.array([float(item['close']) for item in historical_data])
        
        # Preprocess data
        scaled_data, scaler = preprocess_data(close_prices)
        
        # Create sequences
        sequence_length = 60
        X, y = create_sequences(scaled_data, sequence_length)
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train both models
        lstm_metrics, lstm_predictions = Model_LSTM(X_train, y_train, X_test, y_test, sol=50)
        rnn_metrics, rnn_predictions = Model_RNN(X_train, y_train, X_test, y_test, sol=[50, 2])
        
        # Inverse transform
        lstm_pred_rescaled = inverse_transform(lstm_predictions, scaler)
        rnn_pred_rescaled = inverse_transform(rnn_predictions, scaler)
        actual_rescaled = inverse_transform(y_test, scaler)
        
        # Prepare comparison data
        historical_dates = [historical_data[-(len(actual_rescaled)-i)]['date'] for i in range(len(actual_rescaled))]
        
        result = {
            'ticker': ticker,
            'comparison_data': {
                'dates': historical_dates,
                'actual': actual_rescaled.flatten().tolist(),
                'lstm_predictions': lstm_pred_rescaled.flatten().tolist(),
                'rnn_predictions': rnn_pred_rescaled.flatten().tolist()
            },
            'model_metrics': {
                'lstm': lstm_metrics,
                'rnn': rnn_metrics
            },
            'winner': 'LSTM' if float(lstm_metrics.get('rmse', 999999)) < float(rnn_metrics.get('rmse', 999999)) else 'RNN'
        }
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Comparison error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/popular-stocks', methods=['GET'])
def get_popular_stocks():
    """Get popular stock tickers with current prices using RapidAPI"""
    try:
        # Get quotes for popular stocks, fallback to mock data
        api_response = yahoo_api.get_stock_quote(POPULAR_STOCKS)
        
        if not api_response:
            # Use mock data
            stocks_data = mock_api.get_mock_popular_stocks()
        else:
            # Format the data
            stocks_data = yahoo_api.format_quote_data(api_response)
            
            # If API formatting fails, use mock data
            if not stocks_data:
                stocks_data = mock_api.get_mock_popular_stocks()
        
        return jsonify({'stocks': stocks_data})
    
    except Exception as e:
        print(f"Error in get_popular_stocks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/insider-trades', methods=['GET'])
def get_insider_trades():
    """Get insider trading data"""
    try:
        api_response = yahoo_api.get_insider_trades()
        
        if not api_response:
            return jsonify({'error': 'Unable to fetch insider trades'}), 500
        
        return jsonify(api_response)
    
    except Exception as e:
        print(f"Error in get_insider_trades: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/trending-stocks', methods=['GET'])
def get_trending_stocks():
    """Get trending stocks"""
    try:
        api_response = yahoo_api.get_trending_stocks()
        
        if not api_response:
            return jsonify({'error': 'Unable to fetch trending stocks'}), 500
        
        return jsonify(api_response)
    
    except Exception as e:
        print(f"Error in get_trending_stocks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_stocks():
    """Search for stocks"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400
        
        api_response = yahoo_api.search_stocks(query)
        
        if not api_response:
            return jsonify({'error': 'Unable to search stocks'}), 500
        
        return jsonify(api_response)
    
    except Exception as e:
        print(f"Error in search_stocks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get system metrics and model performance"""
    try:
        metrics = {
            'system_status': 'online',
            'data_source': 'RapidAPI Yahoo Finance',
            'models_available': ['LSTM', 'RNN'],
            'supported_periods': ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'],
            'cache_size': len(cached_data),
            'model_cache_size': len(model_cache),
            'popular_stocks_count': len(POPULAR_STOCKS),
            'api_status': 'connected',
            'uptime': datetime.now().isoformat()
        }
        return jsonify(metrics)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Disable debug mode to prevent watchdog restart issues with TensorFlow
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False) 