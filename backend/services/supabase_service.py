"""
Supabase Service for StockNeuro
Handles all database operations with Supabase
"""
import os
from typing import List, Dict, Optional, Any
from datetime import datetime
from supabase import create_client, Client
from core.config import settings
import logging

logger = logging.getLogger("stock_forecasting")


class SupabaseService:
    """Service for interacting with Supabase database"""
    
    def __init__(self):
        """Initialize Supabase client"""
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("Supabase credentials not configured. Supabase features will be disabled.")
            self.client: Optional[Client] = None
        else:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None
    
    def is_enabled(self) -> bool:
        """Check if Supabase is enabled and configured"""
        return self.client is not None
    
    # =====================================================
    # WATCHLIST OPERATIONS
    # =====================================================
    
    async def add_to_watchlist(self, user_id: str, symbol: str, name: Optional[str] = None) -> Dict:
        """Add stock to user's watchlist"""
        if not self.is_enabled():
            raise ValueError("Supabase is not configured")
        
        try:
            result = self.client.table("watchlists").insert({
                "user_id": user_id,
                "symbol": symbol.upper(),
                "name": name,
                "added_at": datetime.now().isoformat()
            }).execute()
            
            if result.data:
                logger.info(f"Added {symbol} to watchlist for user {user_id}")
                return result.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error adding to watchlist: {e}")
            raise
    
    async def get_watchlist(self, user_id: str) -> List[Dict]:
        """Get user's watchlist"""
        if not self.is_enabled():
            return []
        
        try:
            result = self.client.table("watchlists")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("added_at", desc=True)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting watchlist: {e}")
            return []
    
    async def remove_from_watchlist(self, user_id: str, symbol: str) -> bool:
        """Remove stock from user's watchlist"""
        if not self.is_enabled():
            return False
        
        try:
            result = self.client.table("watchlists")\
                .delete()\
                .eq("user_id", user_id)\
                .eq("symbol", symbol.upper())\
                .execute()
            
            logger.info(f"Removed {symbol} from watchlist for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error removing from watchlist: {e}")
            return False
    
    # =====================================================
    # PREDICTION OPERATIONS
    # =====================================================
    
    async def save_prediction(
        self,
        user_id: str,
        ticker: str,
        model_type: str,
        prediction_data: Dict[str, Any],
        period: Optional[str] = None,
        prediction_days: Optional[int] = None
    ) -> Dict:
        """Save prediction to database"""
        if not self.is_enabled():
            raise ValueError("Supabase is not configured")
        
        try:
            prediction_record = {
                "user_id": user_id,
                "ticker": ticker.upper(),
                "model_type": model_type.upper(),
                "period": period,
                "prediction_days": prediction_days,
                "metrics": prediction_data.get("metrics", {}),
                "historical_data": prediction_data.get("historical_data", {}),
                "future_predictions": prediction_data.get("future_predictions", {}),
                "last_price": prediction_data.get("last_price"),
                "predicted_price": prediction_data.get("predicted_price"),
                "created_at": datetime.now().isoformat()
            }
            
            result = self.client.table("predictions").insert(prediction_record).execute()
            
            if result.data:
                logger.info(f"Saved prediction for {ticker} ({model_type}) for user {user_id}")
                return result.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error saving prediction: {e}")
            raise
    
    async def get_user_predictions(
        self,
        user_id: str,
        limit: int = 20,
        ticker: Optional[str] = None
    ) -> List[Dict]:
        """Get user's prediction history"""
        if not self.is_enabled():
            return []
        
        try:
            query = self.client.table("predictions")\
                .select("*")\
                .eq("user_id", user_id)
            
            if ticker:
                query = query.eq("ticker", ticker.upper())
            
            result = query\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return []
    
    # =====================================================
    # PORTFOLIO OPERATIONS
    # =====================================================
    
    async def get_portfolio(self, user_id: str) -> List[Dict]:
        """Get user's portfolio holdings"""
        if not self.is_enabled():
            return []
        
        try:
            result = self.client.table("portfolios")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting portfolio: {e}")
            return []
    
    async def add_to_portfolio(
        self,
        user_id: str,
        ticker: str,
        shares: float,
        entry_price: float,
        notes: Optional[str] = None
    ) -> Dict:
        """Add holding to portfolio"""
        if not self.is_enabled():
            raise ValueError("Supabase is not configured")
        
        try:
            portfolio_record = {
                "user_id": user_id,
                "ticker": ticker.upper(),
                "shares": shares,
                "entry_price": entry_price,
                "entry_date": datetime.now().isoformat(),
                "notes": notes
            }
            
            result = self.client.table("portfolios").insert(portfolio_record).execute()
            
            if result.data:
                logger.info(f"Added {ticker} to portfolio for user {user_id}")
                return result.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error adding to portfolio: {e}")
            raise
    
    async def update_portfolio_price(self, user_id: str, ticker: str, current_price: float) -> bool:
        """Update current price for a portfolio holding"""
        if not self.is_enabled():
            return False
        
        try:
            result = self.client.table("portfolios")\
                .update({"current_price": current_price})\
                .eq("user_id", user_id)\
                .eq("ticker", ticker.upper())\
                .execute()
            
            return True
        except Exception as e:
            logger.error(f"Error updating portfolio price: {e}")
            return False
    
    async def save_portfolio_history(
        self,
        user_id: str,
        total_balance: float,
        cash_balance: float,
        invested: float,
        total_value: float,
        today_pl: float
    ) -> Dict:
        """Save portfolio balance snapshot"""
        if not self.is_enabled():
            raise ValueError("Supabase is not configured")
        
        try:
            history_record = {
                "user_id": user_id,
                "total_balance": total_balance,
                "cash_balance": cash_balance,
                "invested": invested,
                "total_value": total_value,
                "today_pl": today_pl,
                "recorded_at": datetime.now().isoformat()
            }
            
            result = self.client.table("portfolio_history").insert(history_record).execute()
            
            if result.data:
                return result.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error saving portfolio history: {e}")
            raise
    
    async def get_portfolio_history(
        self,
        user_id: str,
        period: str = "1W",
        limit: int = 100
    ) -> List[Dict]:
        """Get portfolio balance history"""
        if not self.is_enabled():
            return []
        
        try:
            # Calculate date range based on period
            from datetime import timedelta
            now = datetime.now()
            
            if period == "1D":
                start_date = now - timedelta(days=1)
            elif period == "1W":
                start_date = now - timedelta(weeks=1)
            elif period == "1M":
                start_date = now - timedelta(days=30)
            elif period == "1Y":
                start_date = now - timedelta(days=365)
            else:
                start_date = now - timedelta(weeks=1)
            
            result = self.client.table("portfolio_history")\
                .select("*")\
                .eq("user_id", user_id)\
                .gte("recorded_at", start_date.isoformat())\
                .order("recorded_at", desc=False)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting portfolio history: {e}")
            return []
    
    # =====================================================
    # USER PROFILE OPERATIONS
    # =====================================================
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile"""
        if not self.is_enabled():
            return None
        
        try:
            result = self.client.table("user_profiles")\
                .select("*")\
                .eq("id", user_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    async def update_user_profile(self, user_id: str, updates: Dict) -> Dict:
        """Update user profile"""
        if not self.is_enabled():
            raise ValueError("Supabase is not configured")
        
        try:
            result = self.client.table("user_profiles")\
                .update(updates)\
                .eq("id", user_id)\
                .execute()
            
            if result.data:
                return result.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise


# Singleton instance
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    """Get singleton Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service














