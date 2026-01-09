"""
Health check endpoints
"""
from fastapi import APIRouter
from datetime import datetime
from core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "debug": settings.DEBUG
    }



