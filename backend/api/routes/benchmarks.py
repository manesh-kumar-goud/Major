"""
Performance benchmarks endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.benchmark_service import BenchmarkService

router = APIRouter()
security = HTTPBearer(auto_error=False)
benchmark_service = BenchmarkService()

@router.get("/performance")
async def get_performance_benchmarks(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get model performance benchmarks"""
    try:
        benchmarks = await benchmark_service.get_benchmarks()
        return benchmarks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_system_metrics(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get system metrics and model information"""
    try:
        metrics = await benchmark_service.get_system_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



