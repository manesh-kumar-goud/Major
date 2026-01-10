# Backend API Endpoints - Complete Reference

## Base URL
- Development: `http://localhost:5000/api`
- Production: (Configured via environment variables)

## Authentication
All endpoints except `/health` support optional Bearer token authentication via `Authorization: Bearer <token>` header.

---

## Health Check

### GET `/api/health`
**Description:** Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T09:22:59.439307",
  "environment": "development",
  "version": "2.0.0",
  "debug": false
}
```

---

## Authentication Endpoints

### POST `/api/auth/register`
**Description:** Register a new user

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### POST `/api/auth/login`
**Description:** Login and get access token

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### GET `/api/auth/me`
**Description:** Get current user information (Requires authentication)

**Response:**
```json
{
  "username": "string",
  "email": "string",
  "full_name": "string"
}
```

---

## Stock Data Endpoints

### GET `/api/stocks/popular`
**Description:** Get popular stocks with current prices

**Response:**
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 150.25,
      "change": 2.35,
      "change_percent": 1.59,
      "volume": 50000000
    }
  ]
}
```

### GET `/api/stocks/history?ticker=AAPL&period=1y`
**Description:** Get historical stock data

**Query Parameters:**
- `ticker` (required): Stock ticker symbol
- `period` (optional, default: "1y"): Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)

**Response:**
```json
{
  "ticker": "AAPL",
  "period": "1y",
  "data": [
    {
      "date": "2025-01-08",
      "open": 150.0,
      "high": 152.5,
      "low": 149.5,
      "close": 151.2,
      "volume": 50000000
    }
  ],
  "total_records": 252
}
```

### GET `/api/stocks/search?q=AAPL`
**Description:** Search for stocks

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc."
    }
  ]
}
```

### GET `/api/stocks/quote/{ticker}`
**Description:** Get real-time stock quote

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 150.25,
  "change": 2.35,
  "change_percent": 1.59,
  "volume": 50000000
}
```

---

## Prediction Endpoints

### POST `/api/predictions/predict`
**Description:** Make stock price prediction using LSTM or RNN

**Request Body:**
```json
{
  "ticker": "TSLA",
  "model": "LSTM",
  "period": "1y",
  "prediction_days": 30
}
```

**Response:**
```json
{
  "ticker": "TSLA",
  "model_type": "LSTM",
  "historical_data": {
    "dates": ["2025-01-01", "2025-01-02"],
    "actual": [150.0, 151.5],
    "predicted": [150.2, 151.3]
  },
  "future_predictions": {
    "dates": ["2025-02-01", "2025-02-02"],
    "predictions": [155.0, 156.5]
  },
  "metrics": {
    "rmse": 0.0234,
    "mae": 0.0189,
    "mse": 0.0005,
    "accuracy": 92.5,
    "r2_score": 0.9876,
    "model_type": "LSTM"
  },
  "last_price": 150.25,
  "prediction_summary": {
    "trend": "bullish",
    "avg_predicted_price": 155.0,
    "price_change_percent": 3.16
  },
  "data_source": "RapidAPI Yahoo Finance",
  "training_samples": 200,
  "test_samples": 50
}
```

### POST `/api/predictions/compare`
**Description:** Compare LSTM vs RNN models

**Request Body:**
```json
{
  "ticker": "TSLA",
  "period": "1y"
}
```

**Response:**
```json
{
  "ticker": "TSLA",
  "comparison_data": {
    "dates": ["2025-01-01", "2025-01-02"],
    "actual": [150.0, 151.5],
    "lstm_predictions": [150.2, 151.3],
    "rnn_predictions": [150.5, 151.8]
  },
  "model_metrics": {
    "lstm": {
      "rmse": 0.0234,
      "mae": 0.0189,
      "mse": 0.0005,
      "accuracy": 92.5,
      "r2_score": 0.9876
    },
    "rnn": {
      "rmse": 0.0345,
      "mae": 0.0287,
      "mse": 0.0012,
      "accuracy": 87.3,
      "r2_score": 0.9734
    }
  },
  "winner": "LSTM"
}
```

### POST `/api/predictions/export`
**Description:** Export predictions as CSV

**Request Body:**
```json
{
  "ticker": "TSLA",
  "model": "LSTM",
  "period": "1y",
  "prediction_days": 30
}
```

**Response:** CSV file download

---

## Benchmark Endpoints

### GET `/api/benchmarks/performance`
**Description:** Get model performance benchmarks

**Response:**
```json
{
  "benchmarks": {
    "lstm": {
      "accuracy": 92.5,
      "rmse": 0.0234,
      "mae": 0.0189,
      "r2_score": 0.9876,
      "training_time_seconds": 720,
      "inference_time_ms": 150,
      "memory_usage_mb": 2100
    },
    "rnn": {
      "accuracy": 87.3,
      "rmse": 0.0345,
      "mae": 0.0287,
      "r2_score": 0.9734,
      "training_time_seconds": 240,
      "inference_time_ms": 45,
      "memory_usage_mb": 800
    }
  },
  "comparison": {
    "best_accuracy": "LSTM",
    "fastest_training": "RNN",
    "fastest_inference": "RNN",
    "lowest_memory": "RNN"
  },
  "data_source": "RapidAPI Yahoo Finance",
  "last_updated": "2026-01-08T09:22:59.439307"
}
```

### GET `/api/benchmarks/metrics`
**Description:** Get system metrics

**Response:**
```json
{
  "system_status": "online",
  "data_source": "RapidAPI Yahoo Finance",
  "models_available": ["LSTM", "RNN"],
  "supported_periods": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"],
  "cache_size": 10,
  "api_status": "connected",
  "rapidapi_configured": true,
  "uptime": "2026-01-08T09:22:59.439307",
  "version": "2.0.0"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

1. All stock tickers are automatically converted to uppercase
2. All timestamps are in ISO 8601 format
3. Price values are floats with 2 decimal precision
4. Metrics accuracy is calculated using tolerance-based method (5% tolerance)
5. Predictions may take 30 seconds to 5 minutes depending on data size and model complexity
6. RapidAPI key is required for stock data endpoints (set `RAPIDAPI_KEY` in `.env` file)














