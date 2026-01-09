"""
Stock data service with async support - REAL DATA ONLY
"""
import asyncio
from typing import List, Dict
from services.api_client import YahooFinanceAPI
from core.config import settings
from core.database import get_cache
import logging

logger = logging.getLogger("stock_forecasting")

class StockService:
    """Service for stock data operations - Uses only real RapidAPI data"""
    
    def __init__(self):
        self.api_client = YahooFinanceAPI()
        self.cache = get_cache()
    
    async def get_stock_history(self, ticker: str, period: str) -> List[Dict]:
        """Get historical stock data with caching - REAL DATA ONLY"""
        cache_key = f"stock_history_{ticker}_{period}"
        
        # Check cache first
        if cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Validate RapidAPI key
        if not settings.RAPIDAPI_KEY or settings.RAPIDAPI_KEY == "":
            error_msg = "RapidAPI key not configured. Please set RAPIDAPI_KEY in your .env file to use real stock data."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get data from API - NO FALLBACK
        try:
            data = await self.api_client.get_stock_history(ticker, period)
            if not data or len(data) == 0:
                error_msg = f"No data returned from RapidAPI for {ticker}. Please check your API key and try again."
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Cache the result
            self.cache[cache_key] = data
            logger.info(f"Successfully fetched {len(data)} data points for {ticker} from RapidAPI")
            return data
        except ValueError:
            # Re-raise ValueError (our custom errors)
            raise
        except Exception as e:
            error_msg = f"Failed to fetch data from RapidAPI: {str(e)}. Please check your API key and internet connection."
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    async def get_popular_stocks(self) -> List[Dict]:
        """Get popular stocks - REAL DATA ONLY"""
        cache_key = "popular_stocks"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Validate RapidAPI key
        if not settings.RAPIDAPI_KEY or settings.RAPIDAPI_KEY == "":
            error_msg = "RapidAPI key not configured. Please set RAPIDAPI_KEY in your .env file."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get data from API - NO FALLBACK
        try:
            stocks = await self.api_client.get_popular_stocks()
            if not stocks or len(stocks) == 0:
                error_msg = "No data returned from RapidAPI. Please check your API key."
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            self.cache[cache_key] = stocks
            logger.info(f"Successfully fetched {len(stocks)} popular stocks from RapidAPI")
            return stocks
        except ValueError:
            raise
        except Exception as e:
            error_msg = f"Failed to fetch popular stocks from RapidAPI: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    async def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks"""
        try:
            # Try API search first
            results = await self.api_client.search_stocks(query)
            
            # If API search returns results, return them
            if results and len(results) > 0:
                return results
            
            # Fallback: search in popular stocks cache
            logger.info(f"API search returned no results, searching popular stocks cache for: {query}")
            popular_stocks = await self.get_popular_stocks()
            
            query_lower = query.lower().strip()
            filtered = []
            for stock in popular_stocks:
                symbol = stock.get("symbol", "").lower()
                name = stock.get("name", "").lower()
                
                if query_lower in symbol or query_lower in name:
                    filtered.append({
                        "symbol": stock.get("symbol", ""),
                        "name": stock.get("name", ""),
                        "price": stock.get("price")
                    })
            
            return filtered[:10]  # Limit to 10 results
            
        except Exception as e:
            logger.warning(f"Search failed: {e}")
            # Final fallback: return empty list
            return []
    
    async def get_stock_quote(self, ticker: str) -> Dict:
        """Get real-time stock quote"""
        try:
            quote = await self.api_client.get_stock_quote(ticker)
            return quote if quote else {}
        except Exception as e:
            logger.warning(f"Quote request failed: {e}")
            return {}


