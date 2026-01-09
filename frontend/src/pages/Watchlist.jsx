import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { db, auth as supabaseAuth } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Watchlist() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState({})

  useEffect(() => {
    loadWatchlist()
  }, [user])

  useEffect(() => {
    if (watchlist.length > 0) {
      fetchQuotes()
    }
    const interval = setInterval(() => {
      if (watchlist.length > 0) {
        fetchQuotes()
      }
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [watchlist])

  const loadWatchlist = async () => {
    try {
      // Try Supabase first if user is authenticated
      if (user && db.watchlist) {
        try {
          const supabaseWatchlist = await db.watchlist.getAll()
          if (supabaseWatchlist && supabaseWatchlist.length > 0) {
            setWatchlist(supabaseWatchlist)
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('Supabase watchlist not available, falling back to localStorage:', e)
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('watchlist')
      if (saved) {
        const stocks = JSON.parse(saved)
        setWatchlist(stocks)
      }
    } catch (e) {
      console.error('Failed to load watchlist:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuotes = async () => {
    if (watchlist.length === 0) return

    try {
      const symbols = watchlist.map(s => s.symbol)
      const quotesData = {}
      
      // Fetch quotes for each symbol individually
      // You could also implement a batch endpoint in the future
      for (const symbol of symbols) {
        try {
          const quoteResponse = await api.get(`/stocks/quote/${symbol}`)
          if (quoteResponse.data && quoteResponse.data.symbol) {
            quotesData[symbol] = quoteResponse.data
          } else if (quoteResponse.data && !quoteResponse.data.symbol) {
            // Handle if API returns data in different format
            quotesData[symbol] = { ...quoteResponse.data, symbol }
          }
        } catch (e) {
          console.error(`Failed to fetch quote for ${symbol}:`, e)
          // Continue with other symbols even if one fails
        }
      }
      setQuotes(quotesData)
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    }
  }

  const removeFromWatchlist = async (symbol) => {
    try {
      // Try Supabase first
      if (user && db.watchlist) {
        await db.watchlist.remove(symbol)
        const updated = watchlist.filter(s => s.symbol !== symbol)
        setWatchlist(updated)
      } else {
        // Fallback to localStorage
        const updated = watchlist.filter(s => s.symbol !== symbol)
        setWatchlist(updated)
        localStorage.setItem('watchlist', JSON.stringify(updated))
      }
      
      const newQuotes = { ...quotes }
      delete newQuotes[symbol]
      setQuotes(newQuotes)
      toast.success(`${symbol} removed from watchlist`)
    } catch (e) {
      console.error('Failed to remove from watchlist:', e)
      toast.error('Failed to remove from watchlist')
    }
  }

  const addToWatchlist = async () => {
    const symbol = prompt('Enter stock symbol to add:')
    if (!symbol || !symbol.trim()) return

    const symbolUpper = symbol.trim().toUpperCase()
    if (watchlist.some(s => s.symbol === symbolUpper)) {
      toast.error(`${symbolUpper} is already in watchlist`)
      return
    }

    try {
      // Try Supabase first
      if (user && db.watchlist) {
        const newItem = await db.watchlist.add(symbolUpper)
        setWatchlist([...watchlist, newItem])
      } else {
        // Fallback to localStorage
        const updated = [...watchlist, { symbol: symbolUpper, addedAt: new Date().toISOString() }]
        setWatchlist(updated)
        localStorage.setItem('watchlist', JSON.stringify(updated))
      }
      
      fetchQuotes()
      toast.success(`${symbolUpper} added to watchlist`)
    } catch (e) {
      console.error('Failed to add to watchlist:', e)
      toast.error(e.message || 'Failed to add to watchlist')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
          <p className="text-text-secondary mt-4">Loading watchlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Watchlist
            </h1>
            <p className="text-text-secondary">Track your favorite stocks</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchQuotes}
              className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">refresh</span>
              Refresh
            </button>
            <button
              onClick={addToWatchlist}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">add</span>
              Add Stock
            </button>
          </div>
        </motion.div>

        {watchlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6">
              <span className="material-symbols-outlined text-primary text-4xl">watch_later</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Watchlist is Empty</h2>
            <p className="text-text-secondary mb-6">Add stocks to track their performance</p>
            <button
              onClick={addToWatchlist}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all font-medium shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">add</span>
              Add Your First Stock
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((stock, index) => {
              const quote = quotes[stock.symbol]
              const change = quote?.change_percent || 0
              const isPositive = change >= 0

              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{stock.symbol}</h3>
                      {quote?.name && (
                        <p className="text-text-secondary text-sm">{quote.name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(stock.symbol)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-border-dark rounded-lg text-text-secondary hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  {quote ? (
                    <>
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-white mb-1">
                          ${typeof quote.price === 'number' ? quote.price.toFixed(2) : quote.price}
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {isPositive ? 'trending_up' : 'trending_down'}
                          </span>
                          <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                          {quote.change && (
                            <span className="ml-1">({isPositive ? '+' : ''}${quote.change.toFixed(2)})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            localStorage.setItem('defaultTicker', stock.symbol)
                            navigate('/prediction')
                          }}
                          className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all text-sm font-medium"
                        >
                          Predict
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('defaultTicker', stock.symbol)
                            navigate('/comparison')
                          }}
                          className="flex-1 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all text-sm font-medium"
                        >
                          Compare
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-text-secondary text-sm">Loading quote...</div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

