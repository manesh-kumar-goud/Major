// API Configuration
const getApiBaseUrl = () => {
  // In production (Vercel), use relative path
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // In development, use localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

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
  return `${API_BASE_URL}${endpoint}`;
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl
}; 