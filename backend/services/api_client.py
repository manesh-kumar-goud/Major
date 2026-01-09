"""
Async Yahoo Finance API client
"""
import httpx
from typing import List, Dict, Optional
from core.config import settings
import logging
import json

logger = logging.getLogger("stock_forecasting")

class YahooFinanceAPI:
    """Async Yahoo Finance API client using RapidAPI"""
    
    def __init__(self):
        self.base_url = settings.RAPIDAPI_BASE_URL
        self.headers = {
            "X-RapidAPI-Host": settings.RAPIDAPI_HOST,
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY
        }
        # Create httpx Timeout object with separate connect and read timeouts
        self.timeout = httpx.Timeout(
            connect=10.0,  # 10 seconds to establish connection
            read=settings.API_REQUEST_TIMEOUT,  # Use configured timeout for reading
            write=10.0,  # 10 seconds for writing
            pool=10.0  # 10 seconds for getting connection from pool
        )
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make async HTTP request - REAL DATA ONLY"""
        if not settings.RAPIDAPI_KEY or settings.RAPIDAPI_KEY == "":
            error_msg = "RapidAPI key not configured. Please set RAPIDAPI_KEY in your .env file."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        url = f"{self.base_url}{endpoint}"
        logger.info(f"Making request to: {url} with params: {params}")
        
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                
                # Check for redirects that lead to HTML pages (common with invalid API keys)
                final_url = str(response.url)
                if 'docs.steadyapi.com' in final_url or 'apidatacenter.com' in final_url:
                    error_msg = f"RapidAPI redirected to documentation page. This means your API key is invalid or the endpoint doesn't exist. Final URL: {final_url}. Please check your RAPIDAPI_KEY in backend/.env"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                
                response.raise_for_status()
                
                # Check if response has content
                response_text = response.text
                if not response_text or len(response_text.strip()) == 0:
                    error_msg = f"RapidAPI returned empty response for {endpoint}. This may indicate an API key issue or endpoint problem."
                    logger.error(error_msg)
                    logger.error(f"Response status: {response.status_code}, Headers: {dict(response.headers)}")
                    raise ValueError(error_msg)
                
                # Try to parse JSON
                try:
                    return response.json()
                except (ValueError, json.JSONDecodeError, httpx.DecodingError) as json_error:
                    # Log the actual response for debugging
                    logger.error(f"JSON parsing error for {endpoint}")
                    logger.error(f"Response status: {response.status_code}")
                    logger.error(f"Response headers: {dict(response.headers)}")
                    logger.error(f"Response content type: {response.headers.get('content-type', 'unknown')}")
                    logger.error(f"Response content length: {len(response_text)}")
                    logger.error(f"Response content (first 500 chars): {response_text[:500]}")
                    
                    # Check if it's an HTML error page (common with API key issues)
                    if response_text.strip().startswith('<'):
                        error_msg = f"RapidAPI returned HTML instead of JSON. This usually means the API key is invalid or the endpoint doesn't exist. Status: {response.status_code}. Check your RAPIDAPI_KEY in backend/.env"
                    elif len(response_text.strip()) == 0:
                        error_msg = f"RapidAPI returned empty response. Status: {response.status_code}. This may indicate an API key issue or endpoint problem."
                    else:
                        error_msg = f"RapidAPI returned invalid JSON: {str(json_error)}. Response preview: {response_text[:200]}"
                    
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                except Exception as json_error:
                    # Catch any other JSON-related errors
                    logger.error(f"Unexpected JSON parsing error: {type(json_error).__name__}: {str(json_error)}")
                    logger.error(f"Response status: {response.status_code}")
                    logger.error(f"Response content: {response_text[:500]}")
                    error_msg = f"Failed to parse RapidAPI response as JSON: {str(json_error)}"
                    raise ValueError(error_msg)
                    
            except httpx.TimeoutException as e:
                error_msg = f"Request timeout after {self.timeout}s. RapidAPI may be slow or unavailable. Please try again."
                logger.error(error_msg)
                raise ValueError(error_msg)
            except httpx.HTTPStatusError as e:
                # Try to get response text for better error message
                try:
                    response_text = e.response.text[:500] if e.response.text else "No response body"
                except:
                    response_text = "Could not read response"
                
                error_msg = f"RapidAPI returned error {e.response.status_code}: {response_text}. Please check your API key and subscription."
                logger.error(error_msg)
                logger.error(f"Request URL: {url}, Params: {params}")
                raise ValueError(error_msg)
            except httpx.ConnectError as e:
                error_msg = f"Cannot connect to RapidAPI. Check your internet connection and firewall settings. Error: {str(e)}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            except httpx.RequestError as e:
                error_msg = f"Network error connecting to RapidAPI: {str(e)}. Please check your internet connection."
                logger.error(error_msg)
                raise ValueError(error_msg)
            except ValueError:
                # Re-raise our custom ValueError messages
                raise
            except httpx.DecodingError as e:
                # Handle httpx JSON decoding errors
                error_msg = f"RapidAPI response decoding error: {str(e)}. The API may have returned invalid or empty JSON."
                logger.error(error_msg)
                logger.error(f"Request URL: {url}, Params: {params}")
                raise ValueError(error_msg)
            except Exception as e:
                # Catch-all for any other unexpected errors
                error_type = type(e).__name__
                error_msg = f"Unexpected error calling RapidAPI ({error_type}): {str(e)}"
                logger.error(error_msg, exc_info=True)
                logger.error(f"Request URL: {url}, Params: {params}")
                raise ValueError(error_msg)
    
    async def get_stock_history(self, symbol: str, period: str = "1y") -> List[Dict]:
        """Get historical stock data"""
        period_mapping = {
            "1d": "1day", "5d": "5day", "1mo": "1month",
            "3mo": "3month", "6mo": "6month", "1y": "1year",
            "2y": "2year", "5y": "5year"
        }
        
        params = {
            "symbol": symbol,
            "period": period_mapping.get(period, "1year"),
            "interval": "1d"
        }
        
        data = await self._make_request("/markets/stock/history", params)
        if data:
            return self._format_historical_data(data, symbol)
        return []
    
    async def get_popular_stocks(self) -> List[Dict]:
        """Get popular stocks using history endpoint (quotes endpoint redirects)"""
        popular_tickers = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX"]
        # Use history endpoint to get latest prices since quotes endpoint doesn't work
        quotes = []
        for ticker in popular_tickers:
            try:
                # Get 1 day of history to get current price
                history_data = await self.get_stock_history(ticker, "1d")
                if history_data and len(history_data) > 0:
                    # Get the most recent data point
                    latest = history_data[-1]
                    # Get previous day for change calculation
                    if len(history_data) > 1:
                        previous = history_data[-2]
                        change = latest['close'] - previous['close']
                        change_percent = (change / previous['close'] * 100) if previous['close'] != 0 else 0
                    else:
                        change = 0
                        change_percent = 0
                    
                    quotes.append({
                        "symbol": ticker,
                        "name": ticker,  # Name not available from history endpoint
                        "price": round(latest['close'], 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "volume": latest.get('volume', 0)
                    })
            except Exception as e:
                logger.warning(f"Failed to get data for {ticker}: {e}")
                continue
        
        return quotes
    
    async def get_stock_quotes(self, symbols: List[str]) -> List[Dict]:
        """Get stock quotes for multiple symbols using history endpoint (quotes endpoint redirects)"""
        # The /markets/stock/quotes endpoint redirects to HTML, so use history endpoint instead
        quotes = []
        logger.info(f"Fetching quotes for symbols: {','.join(symbols)} (using history endpoint)")
        
        for symbol in symbols:
            try:
                # Get 1 day of history to get current price
                history_data = await self.get_stock_history(symbol, "1d")
                if history_data and len(history_data) > 0:
                    # Get the most recent data point
                    latest = history_data[-1]
                    # Get previous day for change calculation
                    if len(history_data) > 1:
                        previous = history_data[-2]
                        change = latest['close'] - previous['close']
                        change_percent = (change / previous['close'] * 100) if previous['close'] != 0 else 0
                    else:
                        change = 0
                        change_percent = 0
                    
                    quotes.append({
                        "symbol": symbol,
                        "name": symbol,  # Name not available from history endpoint
                        "price": round(latest['close'], 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "volume": latest.get('volume', 0)
                    })
            except Exception as e:
                logger.warning(f"Failed to get quote for {symbol}: {e}")
                continue
        
        logger.info(f"Successfully fetched {len(quotes)} quotes using history endpoint")
        return quotes
    
    async def get_stock_quote(self, symbol: str) -> Optional[Dict]:
        """Get single stock quote"""
        quotes = await self.get_stock_quotes([symbol])
        return quotes[0] if quotes else None
    
    async def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks"""
        try:
            params = {"query": query}
            data = await self._make_request("/markets/search", params)
            
            if not data or "body" not in data:
                return []
            
            results = data.get("body", [])
            
            # Format results to match frontend expectations
            formatted_results = []
            if isinstance(results, list):
                for item in results:
                    if isinstance(item, dict):
                        formatted_results.append({
                            "symbol": item.get("symbol") or item.get("ticker") or item.get("tickerSymbol", ""),
                            "name": item.get("name") or item.get("longName") or item.get("shortName", ""),
                            "price": item.get("price") or item.get("regularMarketPrice") or item.get("currentPrice")
                        })
            elif isinstance(results, dict):
                # Single result
                formatted_results.append({
                    "symbol": results.get("symbol") or results.get("ticker") or results.get("tickerSymbol", ""),
                    "name": results.get("name") or results.get("longName") or results.get("shortName", ""),
                    "price": results.get("price") or results.get("regularMarketPrice") or results.get("currentPrice")
                })
            
            return formatted_results
        except Exception as e:
            logger.warning(f"Stock search API failed: {e}")
            return []
    
    def _format_historical_data(self, api_response: Dict, symbol: str) -> List[Dict]:
        """Format API response to standard format"""
        try:
            body = api_response.get("body", {})
            formatted_data = []
            
            if isinstance(body, dict):
                for timestamp, data in body.items():
                    if isinstance(data, dict) and "date" in data:
                        formatted_data.append({
                            "date": data["date"],
                            "open": float(data.get("open", 0)),
                            "high": float(data.get("high", 0)),
                            "low": float(data.get("low", 0)),
                            "close": float(data.get("close", 0)),
                            "volume": int(data.get("volume", 0))
                        })
            
            return sorted(formatted_data, key=lambda x: x["date"])
        except Exception as e:
            logger.error(f"Error formatting historical data: {e}")
            return []
    
    def _format_quote_data(self, api_response: Dict) -> List[Dict]:
        """Format quote data"""
        try:
            # Handle different response formats
            quotes = api_response.get("body", [])
            
            # If body is None or empty, try root level
            if not quotes:
                quotes = api_response if isinstance(api_response, list) else []
            
            # If still not a list, try wrapping
            if not isinstance(quotes, list):
                if isinstance(quotes, dict):
                    quotes = [quotes]
                else:
                    logger.warning(f"Unexpected quote data format: {type(quotes)}")
                    return []
            
            formatted_quotes = []
            for quote in quotes:
                if not isinstance(quote, dict):
                    continue
                    
                symbol = quote.get("symbol", "")
                if not symbol:
                    continue
                    
                current_price = float(quote.get("regularMarketPrice", quote.get("price", 0)))
                previous_close = float(quote.get("regularMarketPreviousClose", quote.get("previousClose", current_price)))
                change = current_price - previous_close
                change_percent = (change / previous_close * 100) if previous_close != 0 else 0
                
                formatted_quotes.append({
                    "symbol": symbol,
                    "name": quote.get("longName", quote.get("shortName", quote.get("name", symbol))),
                    "price": round(current_price, 2),
                    "change": round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "volume": int(quote.get("regularMarketVolume", quote.get("volume", 0)))
                })
            
            if len(formatted_quotes) == 0:
                logger.warning(f"No valid quotes found in response: {api_response}")
            
            return formatted_quotes
        except Exception as e:
            logger.error(f"Error formatting quote data: {e}", exc_info=True)
            logger.error(f"Response data: {api_response}")
            return []


