/**
 * Supabase Client for StockNeuro Frontend
 * Handles authentication and database operations
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Supabase features will be disabled.')
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

export const auth = {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, metadata = {}) {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Additional user metadata
      }
    })
    
    if (error) throw error
    return data
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Store session
    if (data.session) {
      localStorage.setItem('supabase_session', JSON.stringify(data.session))
    }
    
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!supabase) {
      return
    }
    
    await supabase.auth.signOut()
    localStorage.removeItem('supabase_session')
    localStorage.removeItem('token')
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    if (!supabase) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  },

  /**
   * Get current session
   */
  async getSession() {
    if (!supabase) {
      return null
    }
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    if (!supabase) {
      return { data: { subscription: null }, unsubscribe: () => {} }
    }
    
    return supabase.auth.onAuthStateChange(callback)
  }
}

// =====================================================
// DATABASE HELPERS
// =====================================================

export const db = {
  /**
   * Watchlist operations
   */
  watchlist: {
    async add(symbol, name = null) {
      if (!supabase) {
        throw new Error('Supabase is not configured')
      }
      
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          name: name
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getAll() {
      if (!supabase) {
        return []
      }
      
      const user = await auth.getCurrentUser()
      if (!user) return []
      
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching watchlist:', error)
        return []
      }
      return data || []
    },

    async remove(symbol) {
      if (!supabase) {
        throw new Error('Supabase is not configured')
      }
      
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol.toUpperCase())
      
      if (error) throw error
      return true
    }
  },

  /**
   * Predictions operations
   */
  predictions: {
    async save(predictionData) {
      if (!supabase) {
        throw new Error('Supabase is not configured')
      }
      
      const user = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          ...predictionData
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getAll(limit = 20) {
      if (!supabase) {
        return []
      }
      
      const user = await auth.getCurrentUser()
      if (!user) return []
      
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching predictions:', error)
        return []
      }
      return data || []
    }
  },

  /**
   * Portfolio operations
   */
  portfolio: {
    async getHoldings() {
      if (!supabase) {
        return []
      }
      
      const user = await auth.getCurrentUser()
      if (!user) return []
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching portfolio:', error)
        return []
      }
      return data || []
    },

    async getHistory(period = '1W') {
      if (!supabase) {
        return []
      }
      
      const user = await auth.getCurrentUser()
      if (!user) return []
      
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      if (period === '1D') {
        startDate.setDate(now.getDate() - 1)
      } else if (period === '1W') {
        startDate.setDate(now.getDate() - 7)
      } else if (period === '1M') {
        startDate.setMonth(now.getMonth() - 1)
      } else if (period === '1Y') {
        startDate.setFullYear(now.getFullYear() - 1)
      }
      
      const { data, error } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching portfolio history:', error)
        return []
      }
      return data || []
    }
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export const subscribe = {
  /**
   * Subscribe to watchlist changes
   */
  watchlist(callback) {
    if (!supabase) {
      return { unsubscribe: () => {} }
    }
    
    const user = auth.getCurrentUser()
    if (!user) {
      return { unsubscribe: () => {} }
    }
    
    const channel = supabase
      .channel('watchlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watchlists',
          filter: `user_id=eq.${user.id}`
        },
        callback
      )
      .subscribe()
    
    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }
}

export default supabase





