"""
Modern FastAPI Application for Stock Market Forecasting
Supports async operations, JWT authentication, and optimized model inference
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime
import os
from dotenv import load_dotenv

from api.routes import health, stocks, predictions, auth, benchmarks, contact, portfolio
from core.config import settings
from core.database import init_cache
from core.logging import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
logger = setup_logging()

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup
    logger.info("🚀 Starting Stock Market Forecasting API...")
    await init_cache()
    logger.info("✅ Cache initialized")
    logger.info("✅ API ready to accept requests")
    yield
    # Shutdown
    logger.info("🛑 Shutting down API...")

# Create FastAPI app
app = FastAPI(
    title="Stock Market Forecasting API",
    description="Intelligent Stock Market Forecasting Using Deep Learning - LSTM vs RNN",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(benchmarks.router, prefix="/api/benchmarks", tags=["Benchmarks"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Stock Market Forecasting API",
        "version": "2.0.0",
        "docs": "/api/docs",
        "status": "operational"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        timeout_keep_alive=1800  # 30 minutes keep-alive for long-running ML operations
    )
