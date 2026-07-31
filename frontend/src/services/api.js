// ============================================
// api.js - Axios API Service
// Centralized HTTP client for all API calls
// Uses Vite proxy (/api → localhost:5000)
// ============================================
import axios from 'axios'

// Create axios instance with default config
// baseURL '/api' uses Vite's proxy to forward
// requests to the Node.js backend on port 5000
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Request Interceptor
// Automatically attaches the JWT token to every
// outgoing request if one exists in localStorage
// ============================================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================
// Response Interceptor
// Handles 401 errors globally (expired tokens)
// ============================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401, token is invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('tradeguard:unauthorized'))
    }
    return Promise.reject(error)
  }
)

// ============================================
// Auth API Functions
// ============================================

// POST /api/auth/login - Login with email & password
export const login = (credentials) => API.post('/auth/login', credentials)

// POST /api/auth/register - Create new account
export const register = (userData) => API.post('/auth/register', userData)

// GET /api/auth/me - Get current user profile
export const getMe = () => API.get('/auth/me')

// ============================================
// Shipment/Prediction API Functions
// ============================================

// POST /api/predict - Submit shipment for AI risk prediction
export const predictShipment = (shipmentData) => API.post('/predict', shipmentData)

// GET /api/shipments - Get all past shipment predictions
export const getShipments = () => API.get('/shipments')

export const getSortedShipments = (sort = 'createdAt', order = 'desc') => (
  API.get('/shipments', { params: { sort, order } })
)

// GET /api/stats - Get dashboard statistics
export const getStats = () => API.get('/shipments/stats')

// DELETE /api/shipments/:id - Delete a shipment record
export const deleteShipment = (id) => API.post(`/shipments/delete/${id}`)

// ============================================
// Shipment Tracking API Functions
// These reuse the SAME shipment records created by the AI Prediction page.
// ============================================

// GET  /api/shipments/:id          - Get one shipment (with its tracking info)
export const getShipmentById = (id) => API.get(`/shipments/${id}`)

// POST /api/shipments/:id/advance  - Move the shipment to the next stop
export const advanceShipment = (id) => API.post(`/shipments/${id}/advance`)

// POST /api/shipments/:id/deviate  - Simulate a route deviation
export const deviateShipment = (id) => API.post(`/shipments/${id}/deviate`)

// POST /api/shipments/:id/reset    - Reset tracking back to the start
export const resetShipmentTracking = (id) => API.post(`/shipments/${id}/reset`)

export default API
