import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 1800000, // 30 minutes timeout for long-running ML operations
  validateStatus: function (status) {
    return status < 500 // Don't throw for 4xx errors
  }
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout - The operation is taking longer than expected. This may happen with ML training. Please try again or use a shorter time period.'
      } else if (error.message === 'Network Error') {
        error.message = 'Network error - Cannot connect to backend server. Make sure backend is running on port 5000'
      } else {
        error.message = `Network error: ${error.message}`
      }
      console.error('Network error:', error.message)
    }
    
    // Handle HTTP errors
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else if (error.response.status === 0) {
        error.message = 'Cannot connect to backend server. Make sure backend is running on port 5000'
      } else if (error.response.status >= 500) {
        error.message = `Server error: ${error.response.data?.detail || error.message}`
      }
    }
    
    return Promise.reject(error)
  }
)

export default api


