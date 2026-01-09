"""
Database and cache initialization
"""
from core.config import settings
import logging

logger = logging.getLogger("stock_forecasting")

# In-memory cache (can be replaced with Redis)
cache_store = {}

async def init_cache():
    """Initialize cache system"""
    try:
        if settings.USE_REDIS and settings.REDIS_URL:
            try:
                import redis.asyncio as redis
                redis_client = await redis.from_url(settings.REDIS_URL)
                logger.info("✅ Redis cache initialized")
                return redis_client
            except Exception as e:
                logger.warning(f"⚠️  Redis connection failed: {e}. Using in-memory cache.")
        
        logger.info("✅ Using in-memory cache")
        return None
    except Exception as e:
        logger.warning(f"Cache initialization error: {e}. Continuing with in-memory cache.")
        return None

def get_cache():
    """Get cache instance"""
    return cache_store

