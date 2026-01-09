"""
Mock data service for testing and fallback
"""
import numpy as np
from datetime import datetime, timedelta
import random
from typing import List, Dict

class MockDataService:
    """Mock data service for testing and fallback"""
    
    def __init__(self):
        self.popular_tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
    
    def generate_mock_historical_data(self, ticker: str, period: str = '1y', min_days: int = None) -> List[Dict]:
        """Generate mock historical stock data"""
        period_days = {
            '1d': 1, '5d': 5, '1mo': 30, '3mo': 90,
            '6mo': 180, '1y': 252, '2y': 504, '5y': 1260, 'max': 2520
        }
        
        days = period_days.get(period, 252)
        if min_days and days < min_days:
            days = min_days
        
        base_prices = {
            'AAPL': 150.0, 'GOOGL': 2800.0, 'MSFT': 350.0,
            'TSLA': 250.0, 'AMZN': 3400.0, 'META': 320.0,
            'NVDA': 220.0, 'NFLX': 400.0, 'BABA': 90.0, 'CRM': 200.0
        }
        
        base_price = base_prices.get(ticker, 100.0)
        data = []
        current_price = base_price
        
        trend = np.random.normal(0.0001, 0.002)
        volatility = 0.02
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            daily_return = np.random.normal(trend, volatility)
            current_price *= (1 + daily_return)
            current_price = max(current_price, 1.0)
            
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
    
    def get_mock_popular_stocks(self) -> List[Dict]:
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



