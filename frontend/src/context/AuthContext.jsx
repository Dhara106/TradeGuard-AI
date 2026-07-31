// ============================================
// AuthContext.jsx - Authentication State Manager
// Provides login/register/logout functionality
// and persists auth state via localStorage
// ============================================
import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../services/api'

// Create the auth context
const AuthContext = createContext(null)

// ============================================
// AuthProvider - Wraps the app and provides
// auth state + functions to all child components
// ============================================
export const AuthProvider = ({ children }) => {
  // State: current user object, JWT token, loading flag
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // ==========================================
  // On mount: if we have a saved token, try to
  // fetch the user profile from the API
  // ==========================================
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Try to get user data using saved token
          const res = await api.getMe()
          setUser(res.data.user || res.data)
        } catch (err) {
          // Token is invalid/expired - clear it
          console.error('Failed to load user:', err)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [token])

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('tradeguard:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('tradeguard:unauthorized', handleUnauthorized)
  }, [])

  // ==========================================
  // login - Authenticate with email & password
  // Stores the JWT token in localStorage
  // ==========================================
  const login = async (email, password) => {
    try {
      const res = await api.login({ email: email.trim().toLowerCase(), password })
      const { token: newToken, ...userData } = res.data
      // Save token to localStorage for persistence
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      return { success: true }
    } catch (err) {
      // Return error message from API or generic message
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.'
      return { success: false, message }
    }
  }

  // ==========================================
  // register - Create a new account
  // ==========================================
  const register = async (username, email, password) => {
    try {
      const res = await api.register({ username, email: email.trim().toLowerCase(), password })
      const { token: newToken, ...userData } = res.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.'
      return { success: false, message }
    }
  }

  // ==========================================
  // logout - Clear all auth state
  // ==========================================
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Provide all auth state and functions to children
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// useAuth - Custom hook for easy access to
// auth context in any component
// Usage: const { user, login, logout } = useAuth()
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
