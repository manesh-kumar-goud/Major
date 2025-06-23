import requests
import json
from datetime import datetime, timedelta
from config import RAPIDAPI_CONFIG, ENDPOINTS, POPULAR_STOCKS, PERIOD_MAPPING

class YahooFinanceAPI:
    def __init__(self):
        self.base_url = RAPIDAPI_CONFIG['base_url']
        self.headers = RAPIDAPI_CONFIG['headers']
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, endpoint, params=None):
        """Make a request to the RapidAPI Yahoo Finance service"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return None
    
    def get_stock_quote(self, symbols):
        """Get real-time stock quotes"""
        if isinstance(symbols, str):
            symbols = [symbols]
        
        params = {
            'symbols': ','.join(symbols)
        }
        
        data = self._make_request(ENDPOINTS['stocks_quote'], params)
        return data
    
    def get_stock_history(self, symbol, period='1y', interval='1d'):
        """Get historical stock data"""
        # Map period to RapidAPI format
        api_period = PERIOD_MAPPING.get(period, '1year')
        
        params = {
            'symbol': symbol,
            'period': api_period,
            'interval': interval
        }
        
        data = self._make_request(ENDPOINTS['stocks_history'], params)
        return data
    
    def get_trending_stocks(self):
        """Get trending stocks"""
        data = self._make_request(ENDPOINTS['markets_trending'])
        return data
    
    def get_most_active_stocks(self):
        """Get most active stocks"""
        data = self._make_request(ENDPOINTS['markets_most_active'])
        return data
    
    def get_insider_trades(self):
        """Get insider trading data"""
        data = self._make_request(ENDPOINTS['markets_insider_trades'])
        return data
    
    def search_stocks(self, query):
        """Search for stocks"""
        params = {
            'query': query
        }
        data = self._make_request(ENDPOINTS['search'], params)
        return data
    
    def get_company_profile(self, symbol):
        """Get company profile and modules"""
        params = {
            'symbol': symbol,
            'modules': 'defaultKeyStatistics,summaryProfile,financialData'
        }
        data = self._make_request(ENDPOINTS['company_profile'], params)
        return data
    
    def format_historical_data(self, api_response, symbol):
        """Format API response to match our expected format"""
        try:
            if not api_response or 'body' not in api_response:
                return []
            
            body = api_response['body']
            formatted_data = []
            
            # Handle timestamp-based dictionary structure (current API format)
            if isinstance(body, dict) and not any(k in body for k in ['results', 'chart']):
                # This is the timestamp-based structure
                for timestamp, data in body.items():
                    if isinstance(data, dict) and 'date' in data:
                        formatted_data.append({
                            'date': data['date'],
                            'open': float(data.get('open', 0)),
                            'high': float(data.get('high', 0)),
                            'low': float(data.get('low', 0)),
                            'close': float(data.get('close', 0)),
                            'volume': int(data.get('volume', 0))
                        })
                return sorted(formatted_data, key=lambda x: x['date'])
            
            # Handle list structure
            elif isinstance(body, list):
                historical_data = body
            # Handle results structure
            elif 'results' in body:
                historical_data = body['results']
            # Handle chart structure
            elif 'chart' in body:
                chart_data = body['chart']['result'][0]
                timestamps = chart_data['timestamp']
                indicators = chart_data['indicators']['quote'][0]
                
                for i, timestamp in enumerate(timestamps):
                    date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
                    formatted_data.append({
                        'date': date,
                        'open': indicators['open'][i] if indicators['open'][i] else 0,
                        'high': indicators['high'][i] if indicators['high'][i] else 0,
                        'low': indicators['low'][i] if indicators['low'][i] else 0,
                        'close': indicators['close'][i] if indicators['close'][i] else 0,
                        'volume': indicators['volume'][i] if indicators['volume'][i] else 0
                    })
                return sorted(formatted_data, key=lambda x: x['date'])
            else:
                historical_data = body
            
            # Format list-based data
            for item in historical_data:
                # Handle different date formats
                if 'date' in item:
                    date = item['date']
                elif 'datetime' in item:
                    date = item['datetime'][:10]  # Extract date part
                else:
                    continue
                
                formatted_data.append({
                    'date': date,
                    'open': float(item.get('open', 0)),
                    'high': float(item.get('high', 0)),
                    'low': float(item.get('low', 0)),
                    'close': float(item.get('close', 0)),
                    'volume': int(item.get('volume', 0))
                })
            
            return sorted(formatted_data, key=lambda x: x['date'])
            
        except Exception as e:
            print(f"Error formatting historical data: {e}")
            return []
    
    def format_quote_data(self, api_response):
        """Format quote data for popular stocks"""
        try:
            if not api_response or 'body' not in api_response:
                return []
            
            quotes = api_response['body']
            if not isinstance(quotes, list):
                quotes = [quotes]
            
            formatted_quotes = []
            for quote in quotes:
                try:
                    symbol = quote.get('symbol', '')
                    current_price = float(quote.get('regularMarketPrice', 0))
                    previous_close = float(quote.get('regularMarketPreviousClose', current_price))
                    
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close != 0 else 0
                    
                    formatted_quotes.append({
                        'symbol': symbol,
                        'name': quote.get('longName', quote.get('shortName', symbol)),
                        'price': round(current_price, 2),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 2),
                        'volume': int(quote.get('regularMarketVolume', 0))
                    })
                except (ValueError, TypeError, KeyError) as e:
                    print(f"Error processing quote for {quote}: {e}")
                    continue
            
            return formatted_quotes
            
        except Exception as e:
            print(f"Error formatting quote data: {e}")
            return []

# Create a global instance
yahoo_api = YahooFinanceAPI() 