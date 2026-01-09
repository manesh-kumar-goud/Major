"""
Stock data endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings
from services.stock_service import StockService
from services.api_client import YahooFinanceAPI

router = APIRouter()
security = HTTPBearer(auto_error=False)
stock_service = StockService()

@router.get("/history")
async def get_stock_history(
    ticker: str = Query(..., description="Stock ticker symbol"),
    period: str = Query("1y", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get historical stock data"""
    try:
        data = await stock_service.get_stock_history(ticker.upper(), period)
        return {
            "ticker": ticker.upper(),
            "period": period,
            "data": data,
            "total_records": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/popular")
async def get_popular_stocks(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get popular stocks with current prices"""
    try:
        stocks = await stock_service.get_popular_stocks()
        return {"stocks": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_stocks(
    q: str = Query(..., description="Search query"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Search for stocks"""
    try:
        results = await stock_service.search_stocks(q)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quote/{ticker}")
async def get_stock_quote(
    ticker: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get real-time stock quote"""
    try:
        quote = await stock_service.get_stock_quote(ticker.upper())
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


