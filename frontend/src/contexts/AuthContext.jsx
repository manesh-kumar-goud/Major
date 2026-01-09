import { createContext, useContext, useState, useEffect } from 'react'
import { auth as supabaseAuth } from '../services/supabase'
import { api } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for Supabase session first
    checkSupabaseSession()
    
    // Listen to auth state changes
    if (supabaseAuth.onAuthStateChange) {
      const { data: { subscription } } = supabaseAuth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          setToken(session.access_token)
          localStorage.setItem('token', session.access_token)
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setToken(null)
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
        }
      })

      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [])

  const checkSupabaseSession = async () => {
    try {
      const session = await supabaseAuth.getSession()
      if (session) {
        setUser(session.user)
        setToken(session.access_token)
        localStorage.setItem('token', session.access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`
      } else if (token) {
        // Fallback to existing token-based auth
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await fetchUser()
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      // Try Supabase auth first
      if (supabaseAuth.signIn) {
        const data = await supabaseAuth.signIn(email, password)
        if (data.user) {
          setUser(data.user)
          if (data.session) {
            setToken(data.session.access_token)
            localStorage.setItem('token', data.session.access_token)
            api.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`
          }
          return { success: true }
        }
      }
      
      // Fallback to backend auth
      const response = await api.post('/auth/login', { username: email, password })
      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || error.response?.data?.detail || 'Login failed' }
    }
  }

  const register = async (email, password, fullName = null) => {
    try {
      // Try Supabase auth first
      if (supabaseAuth.signUp) {
        const data = await supabaseAuth.signUp(email, password, {
          full_name: fullName || email.split('@')[0]
        })
        if (data.user) {
          setUser(data.user)
          if (data.session) {
            setToken(data.session.access_token)
            localStorage.setItem('token', data.session.access_token)
            api.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`
          }
          return { success: true }
        }
      }
      
      // Fallback to backend auth
      const response = await api.post('/auth/register', {
        username: email.split('@')[0],
        email,
        password,
        full_name: fullName
      })
      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || error.response?.data?.detail || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      if (supabaseAuth.signOut) {
        await supabaseAuth.signOut()
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}



