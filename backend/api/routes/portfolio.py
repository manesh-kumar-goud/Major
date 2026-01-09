"""
Portfolio endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.stock_service import StockService
from services.prediction_history import get_prediction_history_service
import logging

logger = logging.getLogger("stock_forecasting")

router = APIRouter()
security = HTTPBearer(auto_error=False)
stock_service = StockService()

@router.get("/overview")
async def get_portfolio_overview(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get portfolio overview with balance and P&L"""
    try:
        user_id = None
        
        # Try to get user_id from Supabase token
        if credentials:
            try:
                from core.supabase_auth import get_user_id_from_token
                user_id = get_user_id_from_token(credentials.credentials)
            except Exception as e:
                logger.debug(f"Could not extract user_id from token: {e}")
        
        # Try Supabase first if user is authenticated
        if user_id:
            try:
                from services.supabase_service import get_supabase_service
                supabase_service = get_supabase_service()
                if supabase_service.is_enabled():
                    portfolio_data = await supabase_service.get_portfolio(user_id)
                    predictions = await supabase_service.get_user_predictions(user_id, limit=20)
                    
                    if portfolio_data:
                        # Calculate totals from Supabase data
                        total_invested = sum(h.get('shares', 0) * h.get('entry_price', 0) for h in portfolio_data)
                        total_value = sum(h.get('shares', 0) * (h.get('current_price') or h.get('entry_price', 0)) for h in portfolio_data)
                        today_pl = sum(h.get('shares', 0) * (h.get('current_price', 0) - h.get('entry_price', 0)) for h in portfolio_data)
                        
                        return {
                            "total_balance": total_value + 25000.0,  # Add cash
                            "cash_balance": 25000.0,
                            "invested": total_invested,
                            "total_value": total_value,
                            "today_pl": today_pl,
                            "total_return_percent": ((total_value - total_invested) / total_invested * 100) if total_invested > 0 else 0,
                            "is_positive": today_pl >= 0,
                            "holdings": portfolio_data,
                            "prediction_count": len(predictions)
                        }
            except Exception as e:
                logger.warning(f"Could not fetch portfolio from Supabase: {e}, falling back to file-based")
        
        # Fallback to file-based history
        history_service = get_prediction_history_service()
        predictions = history_service.get_recent_predictions(limit=20)
        unique_tickers = history_service.get_unique_tickers()
        
        # If no predictions, use watchlist or popular stocks as fallback
        if not unique_tickers:
            # Try to get from watchlist (stored in localStorage on frontend)
            # For now, use popular stocks as demo
            stocks = await stock_service.get_popular_stocks()
            unique_tickers = [s.get("symbol", "") for s in stocks[:5]]
        
        # Get current quotes for tickers
        holdings = []
        total_invested = 0
        total_value = 0
        today_pl = 0
        
        for ticker in unique_tickers[:10]:  # Limit to 10 holdings
            try:
                # Get current quote
                quote = await stock_service.get_stock_quote(ticker)
                
                if not quote or not quote.get("price"):
                    # Fallback: get from popular stocks
                    stocks = await stock_service.get_popular_stocks()
                    quote = next((s for s in stocks if s.get("symbol", "").upper() == ticker.upper()), {})
                
                if quote and quote.get("price"):
                    # Get latest prediction for this ticker
                    ticker_predictions = [p for p in predictions if p.get("ticker", "").upper() == ticker.upper()]
                    latest_prediction = ticker_predictions[0] if ticker_predictions else None
                    
                    # Calculate shares based on prediction (simulate $10k investment per prediction)
                    if latest_prediction:
                        predicted_price = latest_prediction.get("predicted_price", quote.get("price", 0))
                        entry_price = latest_prediction.get("last_price", quote.get("price", 0))
                        investment_amount = 10000.0  # $10k per prediction
                        shares = investment_amount / entry_price if entry_price > 0 else 0
                    else:
                        shares = 10  # Default shares
                        entry_price = quote.get("price", 0)
                    
                    current_price = quote.get("price", 0)
                    change = quote.get("change", 0)
                    change_percent = quote.get("change_percent", 0)
                    value = shares * current_price
                    pl = shares * change
                    
                    total_invested += shares * entry_price
                    total_value += value
                    today_pl += pl
                    
                    holdings.append({
                        "symbol": ticker,
                        "name": quote.get("name", ticker),
                        "shares": round(shares, 2),
                        "price": round(current_price, 2),
                        "value": round(value, 2),
                        "change": round(change_percent, 2),
                        "change_amount": round(change, 2),
                        "entry_price": round(entry_price, 2),
                        "predicted_price": latest_prediction.get("predicted_price", 0) if latest_prediction else None
                    })
            except Exception as e:
                logger.warning(f"Error processing ticker {ticker}: {e}")
                continue
        
        cash_balance = 25000.0  # Simulated cash
        total_balance = total_value + cash_balance
        total_return_percent = ((total_value - total_invested) / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "total_balance": round(total_balance, 2),
            "cash_balance": round(cash_balance, 2),
            "invested": round(total_invested, 2),
            "total_value": round(total_value, 2),
            "today_pl": round(today_pl, 2),
            "total_return_percent": round(total_return_percent, 2),
            "is_positive": today_pl >= 0,
            "holdings": holdings,
            "prediction_count": len(predictions)
        }
    except Exception as e:
        logger.error(f"Error getting portfolio overview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_portfolio_history(
    period: str = "1W",
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get portfolio balance history for chart"""
    try:
        user_id = None
        
        # Try to get user_id from Supabase token
        if credentials:
            try:
                from core.supabase_auth import get_user_id_from_token
                user_id = get_user_id_from_token(credentials.credentials)
            except Exception as e:
                logger.debug(f"Could not extract user_id from token: {e}")
        
        # Try Supabase first if user is authenticated
        if user_id:
            try:
                from services.supabase_service import get_supabase_service
                supabase_service = get_supabase_service()
                if supabase_service.is_enabled():
                    history = await supabase_service.get_portfolio_history(user_id, period=period)
                    if history:
                        # Format for frontend
                        formatted_history = [
                            {
                                "date": h.get("recorded_at", "").split("T")[0] if h.get("recorded_at") else "",
                                "value": h.get("total_balance", 0)
                            }
                            for h in history
                        ]
                        return {
                            "period": period,
                            "data": formatted_history
                        }
            except Exception as e:
                logger.warning(f"Could not fetch portfolio history from Supabase: {e}, falling back to mock data")
        
        # Fallback to mock data
        import random
        from datetime import datetime, timedelta
        
        base_balance = 140000.0
        
        if period == "1D":
            # Hourly data for 1 day
            points = 24
            dates = [(datetime.now() - timedelta(hours=i)).strftime("%H:00") for i in range(points-1, -1, -1)]
        elif period == "1W":
            # Daily data for 1 week
            points = 7
            dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        elif period == "1M":
            # Weekly data for 1 month
            points = 4
            dates = [f"Week {i+1}" for i in range(points)]
        elif period == "1Y":
            # Monthly data for 1 year
            points = 12
            dates = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        else:
            points = 7
            dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        # Generate realistic balance progression
        history = []
        current_balance = base_balance
        for i, date in enumerate(dates):
            # Add some realistic variation
            variation = random.uniform(-2000, 3000)
            current_balance += variation
            current_balance = max(120000, min(160000, current_balance))  # Keep in reasonable range
            
            history.append({
                "date": date,
                "value": round(current_balance, 2)
            })
        
        return {
            "period": period,
            "data": history
        }
    except Exception as e:
        logger.error(f"Error getting portfolio history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

