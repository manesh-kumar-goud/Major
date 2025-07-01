from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import requests
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# Configuration
RAPIDAPI_CONFIG = {
    'base_url': 'https://yahoo-finance15.p.rapidapi.com/api/v1',
    'headers': {
        'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com',
        'X-RapidAPI-Key': os.getenv('RAPIDAPI_KEY', 'your-api-key-here')
    }
}

def make_api_request(endpoint, params=None):
    """Make request to RapidAPI Yahoo Finance"""
    try:
        url = f"{RAPIDAPI_CONFIG['base_url']}/{endpoint}"
        response = requests.get(url, headers=RAPIDAPI_CONFIG['headers'], params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        print(f"API request error: {e}")
        return None

def generate_mock_prediction(ticker, days=30):
    """Generate mock predictions for demo purposes"""
    base_price = random.uniform(100, 300)
    predictions = []
    
    for i in range(days):
        date = datetime.now() + timedelta(days=i+1)
        # Simple random walk with slight upward trend
        price_change = random.uniform(-0.05, 0.07) * base_price
        base_price += price_change
        
        predictions.append({
            'date': date.strftime('%Y-%m-%d'),
            'predicted_price': round(base_price, 2),
            'confidence': random.uniform(0.7, 0.95)
        })
    
    return predictions

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/stock-history', methods=['GET'])
def get_stock_history():
    ticker = request.args.get('ticker', 'AAPL')
    period = request.args.get('period', '1y')
    
    # Try to get real data from RapidAPI
    data = make_api_request('stock/history', {'symbol': ticker, 'period': period})
    
    if data:
        return jsonify(data)
    else:
        # Return mock data if API fails
        mock_data = []
        for i in range(252):  # ~1 year of trading days
            date = datetime.now() - timedelta(days=i)
            price = random.uniform(100, 200)
            mock_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(price, 2),
                'high': round(price * 1.05, 2),
                'low': round(price * 0.95, 2),
                'close': round(price * random.uniform(0.98, 1.02), 2),
                'volume': random.randint(1000000, 50000000)
            })
        
        return jsonify({
            'symbol': ticker,
            'data': mock_data[::-1]  # Reverse to get chronological order
        })

@app.route('/api/popular-stocks', methods=['GET'])
def get_popular_stocks():
    # Try to get real data
    data = make_api_request('market/popular')
    
    if data:
        return jsonify(data)
    else:
        # Return mock popular stocks
        mock_stocks = [
            {'symbol': 'AAPL', 'name': 'Apple Inc.', 'price': 175.32, 'change': 2.45, 'changePercent': 1.42},
            {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'price': 2845.67, 'change': -15.23, 'changePercent': -0.53},
            {'symbol': 'MSFT', 'name': 'Microsoft Corp.', 'price': 332.89, 'change': 5.67, 'changePercent': 1.73},
            {'symbol': 'TSLA', 'name': 'Tesla Inc.', 'price': 254.12, 'change': 12.34, 'changePercent': 5.10},
            {'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'price': 3456.78, 'change': -23.45, 'changePercent': -0.67}
        ]
        return jsonify(mock_stocks)

@app.route('/api/predict', methods=['POST'])
def predict_stock():
    data = request.get_json()
    ticker = data.get('ticker', 'AAPL')
    model_type = data.get('model_type', 'LSTM')
    days = data.get('days', 30)
    
    # Generate mock predictions
    predictions = generate_mock_prediction(ticker, days)
    
    # Mock model performance metrics
    metrics = {
        'rmse': random.uniform(0.02, 0.05),
        'mae': random.uniform(0.015, 0.04),
        'r2_score': random.uniform(0.85, 0.95),
        'accuracy': random.uniform(0.82, 0.94)
    }
    
    return jsonify({
        'ticker': ticker,
        'model_type': model_type,
        'predictions': predictions,
        'metrics': metrics,
        'training_time': f"{random.uniform(5, 15):.1f} minutes",
        'model_confidence': random.uniform(0.8, 0.95)
    })

@app.route('/api/compare-models', methods=['POST'])
def compare_models():
    data = request.get_json()
    ticker = data.get('ticker', 'AAPL')
    days = data.get('days', 30)
    
    # Generate predictions for both models
    lstm_predictions = generate_mock_prediction(ticker, days)
    rnn_predictions = generate_mock_prediction(ticker, days)
    
    comparison = {
        'ticker': ticker,
        'LSTM': {
            'predictions': lstm_predictions,
            'metrics': {
                'rmse': random.uniform(0.02, 0.03),
                'mae': random.uniform(0.015, 0.025),
                'r2_score': random.uniform(0.90, 0.95),
                'accuracy': random.uniform(0.88, 0.93)
            },
            'training_time': f"{random.uniform(10, 20):.1f} minutes"
        },
        'RNN': {
            'predictions': rnn_predictions,
            'metrics': {
                'rmse': random.uniform(0.03, 0.05),
                'mae': random.uniform(0.025, 0.04),
                'r2_score': random.uniform(0.80, 0.88),
                'accuracy': random.uniform(0.82, 0.88)
            },
            'training_time': f"{random.uniform(3, 8):.1f} minutes"
        }
    }
    
    return jsonify(comparison)

@app.route('/api/search', methods=['GET'])
def search_stocks():
    query = request.args.get('q', '')
    
    # Mock search results
    if 'apple' in query.lower():
        results = [{'symbol': 'AAPL', 'name': 'Apple Inc.'}]
    elif 'google' in query.lower():
        results = [{'symbol': 'GOOGL', 'name': 'Alphabet Inc.'}]
    elif 'microsoft' in query.lower():
        results = [{'symbol': 'MSFT', 'name': 'Microsoft Corp.'}]
    else:
        results = [
            {'symbol': 'AAPL', 'name': 'Apple Inc.'},
            {'symbol': 'GOOGL', 'name': 'Alphabet Inc.'},
            {'symbol': 'MSFT', 'name': 'Microsoft Corp.'}
        ]
    
    return jsonify(results)

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        'system_status': 'operational',
        'models_available': ['LSTM', 'RNN'],
        'supported_tickers': ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
        'last_updated': datetime.now().isoformat(),
        'api_version': '1.0.0'
    })

# For Vercel serverless deployment
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True) 