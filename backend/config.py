import os
from dotenv import load_dotenv

# Load environment variables from .env file in parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuration for RapidAPI Yahoo Finance
RAPIDAPI_CONFIG = {
    'base_url': os.getenv('RAPIDAPI_BASE_URL', 'https://yahoo-finance15.p.rapidapi.com/api/v1'),
    'headers': {
        'X-RapidAPI-Host': os.getenv('RAPIDAPI_HOST', 'yahoo-finance15.p.rapidapi.com'),
        'X-RapidAPI-Key': os.getenv('RAPIDAPI_KEY', 'your-default-key-here')
    },
    'timeout': int(os.getenv('API_REQUEST_TIMEOUT', '30')),
    'max_retries': int(os.getenv('API_MAX_RETRIES', '3'))
}

# Flask Configuration
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # API Configuration
    API_RATE_LIMIT = int(os.getenv('API_RATE_LIMIT', '100'))
    API_TIMEOUT = int(os.getenv('API_REQUEST_TIMEOUT', '30'))
    API_MAX_RETRIES = int(os.getenv('API_MAX_RETRIES', '3'))
    
    # Model Configuration
    MODEL_CACHE_TTL = int(os.getenv('MODEL_CACHE_TTL', '3600'))  # 1 hour
    DATA_CACHE_TTL = int(os.getenv('DATA_CACHE_TTL', '1800'))   # 30 minutes

# API Endpoints from environment variables
ENDPOINTS = {
    'markets_insider_trades': os.getenv('RAPIDAPI_INSIDER_TRADES_ENDPOINT', '/markets/insider-trades'),
    'stocks_quote': os.getenv('RAPIDAPI_STOCK_QUOTES_ENDPOINT', '/markets/stock/quotes'),
    'stocks_history': os.getenv('RAPIDAPI_STOCK_HISTORY_ENDPOINT', '/markets/stock/history'),
    'markets_trending': os.getenv('RAPIDAPI_TRENDING_ENDPOINT', '/markets/trending'),
    'markets_most_active': os.getenv('RAPIDAPI_MOST_ACTIVE_ENDPOINT', '/markets/most-active'),
    'company_profile': os.getenv('RAPIDAPI_COMPANY_PROFILE_ENDPOINT', '/markets/stock/modules'),
    'search': os.getenv('RAPIDAPI_SEARCH_ENDPOINT', '/markets/search')
}

# Popular stock symbols for quick access
POPULAR_STOCKS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
    'META', 'NVDA', 'NFLX', 'BABA', 'CRM',
    'UBER', 'SPOT', 'ZOOM', 'SQ', 'PYPL'
]

# Time period mappings
PERIOD_MAPPING = {
    '1d': '1day',
    '5d': '5day', 
    '1mo': '1month',
    '3mo': '3month',
    '6mo': '6month',
    '1y': '1year',
    '2y': '2year',
    '5y': '5year',
    'max': 'max'
}

# Validation function
def validate_config():
    """Validate that all required environment variables are set"""
    # Make RAPIDAPI_KEY optional - we can use mock data if it's not available
    required_vars = ['SECRET_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    # Check if RAPIDAPI_KEY is available
    if not os.getenv('RAPIDAPI_KEY') or os.getenv('RAPIDAPI_KEY') == 'your-rapidapi-key-here':
        print("⚠️  Warning: RAPIDAPI_KEY not configured - using mock data")
    else:
        print("✅ RapidAPI key configured")
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    return True

# Helper function to get full API URL
def get_api_url(endpoint_key):
    """Get full API URL for a given endpoint"""
    base_url = RAPIDAPI_CONFIG['base_url']
    endpoint = ENDPOINTS.get(endpoint_key, '')
    return f"{base_url}{endpoint}"

# Helper function to get API headers
def get_api_headers():
    """Get API headers for RapidAPI requests"""
    return RAPIDAPI_CONFIG['headers'].copy()

# Helper function to get API request config
def get_api_request_config():
    """Get API request configuration (timeout, retries, etc.)"""
    return {
        'timeout': RAPIDAPI_CONFIG['timeout'],
        'max_retries': RAPIDAPI_CONFIG['max_retries'],
        'headers': get_api_headers()
    } 