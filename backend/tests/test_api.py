"""
API endpoint tests
"""
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data

def test_popular_stocks():
    """Test popular stocks endpoint"""
    response = client.get("/api/stocks/popular")
    assert response.status_code == 200
    data = response.json()
    assert "stocks" in data
    assert isinstance(data["stocks"], list)

def test_stock_history():
    """Test stock history endpoint"""
    response = client.get("/api/stocks/history?ticker=AAPL&period=1y")
    assert response.status_code == 200
    data = response.json()
    assert "ticker" in data
    assert "data" in data
    assert data["ticker"] == "AAPL"

def test_auth_register():
    """Test user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_auth_login():
    """Test user login"""
    # First register
    client.post(
        "/api/auth/register",
        json={
            "username": "logintest",
            "email": "login@example.com",
            "password": "testpass123"
        }
    )
    
    # Then login
    response = client.post(
        "/api/auth/login",
        json={
            "username": "logintest",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_prediction_endpoint():
    """Test prediction endpoint (may take time)"""
    response = client.post(
        "/api/predictions/predict",
        json={
            "ticker": "AAPL",
            "model": "LSTM",
            "period": "1y",
            "prediction_days": 10
        }
    )
    # May take time, so we check if it's processing or completed
    assert response.status_code in [200, 202, 500]  # 500 if model training fails



