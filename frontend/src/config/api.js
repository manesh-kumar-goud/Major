// API Configuration
const getApiBaseUrl = () => {
  // For frontend-only deployment, use mock data
  if (process.env.NODE_ENV === 'production') {
    return 'MOCK'; // This will trigger mock data usage
  }
  
  // In development, use localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Check if we should use mock data
export const USE_MOCK_DATA = API_BASE_URL === 'MOCK';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  STOCK_HISTORY: '/stock-history',
  POPULAR_STOCKS: '/popular-stocks',
  PREDICT: '/predict',
  COMPARE_MODELS: '/compare-models',
  SEARCH: '/search',
  METRICS: '/metrics'
};

// API utility functions
export const buildApiUrl = (endpoint) => {
  if (USE_MOCK_DATA) {
    return null; // Don't make API calls, use mock data instead
  }
  return `${API_BASE_URL}${endpoint}`;
};

// Mock data for frontend-only deployment
export const MOCK_DATA = {
  popularStocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 195.32, change: 2.45, changePercent: 1.27 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.67, change: -1.23, changePercent: -0.85 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.89, change: 5.67, changePercent: 1.52 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 254.12, change: 12.34, changePercent: 5.10 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.78, change: -3.45, changePercent: -2.17 }
  ],
  
  generatePrediction: (ticker, days = 30) => {
    const basePrice = Math.random() * 200 + 100;
    const predictions = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const priceChange = (Math.random() - 0.5) * 10;
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted_price: Math.round((basePrice + priceChange) * 100) / 100,
        confidence: Math.random() * 0.3 + 0.7
      });
    }
    
    return {
      ticker,
      predictions,
      metrics: {
        rmse: Math.random() * 0.03 + 0.02,
        mae: Math.random() * 0.025 + 0.015,
        r2_score: Math.random() * 0.1 + 0.85,
        accuracy: Math.random() * 0.12 + 0.82
      },
      training_time: `${(Math.random() * 10 + 5).toFixed(1)} minutes`,
      model_confidence: Math.random() * 0.15 + 0.8
    };
  }
};

const apiConfig = {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  USE_MOCK_DATA,
  MOCK_DATA
};

export default apiConfig; 