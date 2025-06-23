import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

class MockYahooFinanceAPI:
    """Mock Yahoo Finance API for testing and fallback"""
    
    def __init__(self):
        self.popular_tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
    
    def generate_mock_historical_data(self, symbol, period='1y', days=252):
        """Generate realistic mock historical stock data"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Generate date range
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        date_range = [d for d in date_range if d.weekday() < 5]  # Only weekdays
        
        # Generate realistic stock prices with trend and volatility
        base_price = random.uniform(50, 300)  # Starting price
        trend = random.uniform(-0.0005, 0.001)  # Daily trend
        volatility = random.uniform(0.01, 0.03)  # Daily volatility
        
        prices = []
        current_price = base_price
        
        for i, date in enumerate(date_range):
            # Add trend and random walk
            daily_return = trend + np.random.normal(0, volatility)
            current_price *= (1 + daily_return)
            
            # Generate OHLC data
            open_price = current_price * random.uniform(0.99, 1.01)
            close_price = current_price
            high_price = max(open_price, close_price) * random.uniform(1.0, 1.02)
            low_price = min(open_price, close_price) * random.uniform(0.98, 1.0)
            volume = random.randint(1000000, 10000000)
            
            prices.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(open_price, 2),
                'high': round(high_price, 2),
                'low': round(low_price, 2),
                'close': round(close_price, 2),
                'volume': volume
            })
        
        return prices
    
    def get_mock_popular_stocks(self):
        """Generate mock popular stocks data"""
        stocks = []
        for ticker in self.popular_tickers:
            price = random.uniform(50, 300)
            change = random.uniform(-10, 10)
            change_percent = (change / price) * 100
            
            stocks.append({
                'symbol': ticker,
                'name': f'{ticker} Inc.',
                'price': round(price, 2),
                'change': round(change, 2),
                'change_percent': round(change_percent, 2),
                'volume': random.randint(1000000, 50000000)
            })
        
        return stocks
    
    def get_mock_insider_trades(self):
        """Generate mock insider trading data"""
        return {
            'message': 'Mock insider trading data - API endpoint not available',
            'data': [
                {
                    'symbol': 'AAPL',
                    'insider': 'John Doe',
                    'position': 'CEO',
                    'transaction': 'Purchase',
                    'shares': 10000,
                    'price': 150.00,
                    'date': '2024-01-15'
                }
            ]
        }

# Create global instance
mock_api = MockYahooFinanceAPI() 