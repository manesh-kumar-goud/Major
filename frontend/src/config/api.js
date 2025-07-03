// API Configuration
const getApiBaseUrl = () => {
  // For Railway.app deployment, use the Railway app URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://your-railway-app.railway.app/api';
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

const apiConfig = {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl
};

export default apiConfig; 