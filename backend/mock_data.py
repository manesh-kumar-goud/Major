import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

class MockYahooFinanceAPI:
    """Mock Yahoo Finance API for testing and fallback"""
    
    def __init__(self):
        self.popular_tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
    
    def generate_mock_historical_data(self, ticker, period='1y', min_days=None):
        """Generate mock historical stock data for testing purposes"""
        
        # Determine number of days based on period
        period_days = {
            '1d': 1,
            '5d': 5,
            '1mo': 30,
            '3mo': 90,
            '6mo': 180,
            '1y': 252,  # Trading days in a year
            '2y': 504,
            '5y': 1260,
            'max': 2520
        }
        
        days = period_days.get(period, 252)
        if min_days and days < min_days:
            days = min_days
        
        # Base price for different tickers
        base_prices = {
            'AAPL': 150.0,
            'GOOGL': 2800.0,
            'MSFT': 350.0,
            'TSLA': 250.0,
            'AMZN': 3400.0,
            'META': 320.0,
            'NVDA': 220.0,
            'NFLX': 400.0,
            'BABA': 90.0,
            'CRM': 200.0
        }
        
        base_price = base_prices.get(ticker, 100.0)
        
        # Generate realistic stock data
        data = []
        current_price = base_price
        
        # Add some trend and volatility
        trend = np.random.normal(0.0001, 0.002)  # Slight upward bias
        volatility = 0.02  # 2% daily volatility
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            
            # Random walk with trend
            daily_return = np.random.normal(trend, volatility)
            current_price *= (1 + daily_return)
            
            # Ensure price doesn't go negative
            current_price = max(current_price, 1.0)
            
            # Create OHLC data
            high = current_price * (1 + abs(np.random.normal(0, 0.01)))
            low = current_price * (1 - abs(np.random.normal(0, 0.01)))
            open_price = low + (high - low) * np.random.random()
            
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(current_price, 2),
                'volume': int(np.random.uniform(1000000, 10000000))
            })
        
        return data
    
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