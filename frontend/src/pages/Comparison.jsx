import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { db } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Comparison() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Initialize ticker from localStorage if available (from Watchlist navigation)
  const getInitialTicker = () => {
    const savedTicker = localStorage.getItem('defaultTicker')
    if (savedTicker) {
      return savedTicker.toUpperCase()
    }
    return 'TSLA' // Default fallback
  }

  const [formData, setFormData] = useState({
    ticker: getInitialTicker(),
    period: '1y'
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    // Check for ticker from localStorage on mount and route changes (for navigation from Watchlist)
    const savedTicker = localStorage.getItem('defaultTicker')
    if (savedTicker) {
      const tickerUpper = savedTicker.toUpperCase()
      setFormData(prev => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.ticker !== tickerUpper) {
          return { ...prev, ticker: tickerUpper }
        }
        return prev
      })
      localStorage.removeItem('defaultTicker') // Clear after reading
    }

    // Check if comparison data was passed from prediction page
    const savedData = localStorage.getItem('comparisonData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setResults(data)
        localStorage.removeItem('comparisonData')
        toast.success('Comparison data loaded!')
      } catch (e) {
        console.error('Failed to load comparison data:', e)
      }
    }
  }, [location.pathname]) // Run when route changes

  const addToWatchlist = async (tickerToAdd) => {
    try {
      const ticker = tickerToAdd || results?.ticker || formData.ticker
      if (!ticker) {
        toast.error('No ticker symbol available')
        return false
      }
      
      const tickerUpper = ticker.toUpperCase()
      
      // Try Supabase first if user is authenticated
      if (user && db && db.watchlist) {
        try {
          await db.watchlist.add(tickerUpper)
          toast.success(`${tickerUpper} added to watchlist!`)
          return true
        } catch (e) {
          console.warn('Supabase watchlist failed, using localStorage:', e)
          // Fall through to localStorage
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('watchlist')
      const watchlist = saved ? JSON.parse(saved) : []
      
      if (!watchlist.some(s => s.symbol === tickerUpper)) {
        watchlist.push({ 
          symbol: tickerUpper, 
          addedAt: new Date().toISOString() 
        })
        localStorage.setItem('watchlist', JSON.stringify(watchlist))
        toast.success(`${tickerUpper} added to watchlist!`)
        return true
      } else {
        toast(`${tickerUpper} is already in watchlist`, { icon: 'ℹ️' })
        return false
      }
    } catch (e) {
      console.error('Watchlist error:', e)
      toast.error(`Failed to add to watchlist: ${e.message || 'Unknown error'}`)
      return false
    }
  }

  const handleCompare = async () => {
    if (!formData.ticker) {
      toast.error('Please enter a stock symbol')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/predictions/compare', {
        ticker: formData.ticker.toUpperCase(),
        period: formData.period
      })
      
      // Validate response data structure
      if (response.data && response.data.comparison_data) {
        console.log('Comparison data received:', {
          dates: response.data.comparison_data.dates?.length || 0,
          actual: response.data.comparison_data.actual?.length || 0,
          lstm: response.data.comparison_data.lstm_predictions?.length || 0,
          rnn: response.data.comparison_data.rnn_predictions?.length || 0
        })
        setResults(response.data)
        toast.success('Comparison completed!')
      } else {
        throw new Error('Invalid comparison data structure from server')
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const chartData = results && results.comparison_data ? (results.comparison_data.dates || []).map((date, i) => ({
    date: date.split('T')[0] || date,
    actual: results.comparison_data.actual?.[i] || null,
    lstm: results.comparison_data.lstm_predictions?.[i] || null,
    rnn: results.comparison_data.rnn_predictions?.[i] || null
  })).filter(item => item.actual !== null || item.lstm !== null || item.rnn !== null) : []

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  return (
    <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark font-display text-white overflow-hidden">
      {/* Top Navigation - Same as Prediction page */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark px-6 py-3 bg-surface-dark flex-shrink-0 z-50 relative">
        <div className="flex items-center gap-4 text-white">
          <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg text-primary">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h2 
            className="text-white text-xl font-bold leading-tight tracking-[-0.015em] cursor-pointer" 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate('/')
            }}
          >
            StockNeuro
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <div className="hidden md:flex gap-2 text-sm font-medium text-text-secondary">
            <span className="px-3 py-1 rounded-full bg-border-dark/50 text-white">Comparison</span>
            <button 
              type="button"
              className="px-3 py-1 hover:text-white cursor-pointer transition-colors" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate('/')
              }}
            >
              Home
            </button>
            <button 
              type="button"
              className="px-3 py-1 hover:text-white cursor-pointer transition-colors" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate('/prediction')
              }}
            >
              Prediction
            </button>
            <button 
              type="button"
              className="px-3 py-1 hover:text-white cursor-pointer transition-colors" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate('/benchmarks')
              }}
            >
              Benchmarks
            </button>
            <button 
              type="button"
              className="px-3 py-1 hover:text-white cursor-pointer transition-colors" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate('/watchlist')
              }}
            >
              Watchlist
            </button>
          </div>
          <div className="h-8 w-[1px] bg-border-dark"></div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate('/profile')
            }}
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 ring-2 ring-border-dark bg-gradient-to-br from-blue-500 to-purple-500 cursor-pointer hover:ring-primary transition-all relative z-10"
            title="Profile"
          />
        </div>
      </header>

      {/* Main Layout - Same structure as Prediction */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Control Panel - Same as Prediction */}
        <aside className="w-80 flex flex-col border-r border-border-dark bg-surface-dark overflow-y-auto z-10">
          <div className="p-6 flex flex-col gap-8">
            {/* Stock Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Data Source</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-text-secondary text-[20px]">search</span>
                <input
                  className="form-input w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary pl-10 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Symbol (e.g. AAPL)"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Timeframe</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-background-dark border border-border-dark rounded-lg p-2.5 cursor-pointer hover:border-text-secondary transition-colors">
                  <span className="text-sm text-text-secondary">Period</span>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="text-sm font-medium bg-transparent border-none outline-none text-white cursor-pointer"
                  >
                    <option value="3mo">3 Months</option>
                    <option value="6mo">6 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="2y">2 Years</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border-dark w-full"></div>

            {/* Info Section */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Model Comparison</label>
              <div className="bg-background-dark border border-border-dark rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-2">This will compare both LSTM and RNN models side-by-side.</p>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Both models will be trained and evaluated</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-border-dark bg-surface-dark sticky bottom-0">
            <button
              onClick={handleCompare}
              disabled={loading || !formData.ticker}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>compare_arrows</span>
              {loading ? 'Comparing...' : 'Compare Models'}
            </button>
          </div>
        </aside>

        {/* Main Content Area - Same as Prediction */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 chart-grid opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
              {/* Page Header */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                    {results ? `${results.ticker}` : formData.ticker} Model Comparison
                    {results && (
                      <span className="ml-3 text-lg text-primary font-semibold">
                        (LSTM vs RNN)
                      </span>
                    )}
                  </h1>
                  <p className="text-text-secondary flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                    Market Open • {getCurrentDate()}
                    {results && results.winner && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-primary">Winner: {results.winner}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {results && (
                    <>
                      <button
                        onClick={() => {
                          if (!results || !results.comparison_data) {
                            toast.error('No comparison data to export.')
                            return
                          }

                          const header = ['Date', 'Actual', 'LSTM Predictions', 'RNN Predictions']
                          const rows = results.comparison_data.dates.map((date, i) => [
                            date.split('T')[0] || date,
                            results.comparison_data.actual[i],
                            results.comparison_data.lstm_predictions[i],
                            results.comparison_data.rnn_predictions[i]
                          ])

                          let csvContent = header.join(',') + '\n'
                          rows.forEach(row => {
                            csvContent += row.join(',') + '\n'
                          })

                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.setAttribute('href', url)
                          link.setAttribute('download', `${results.ticker}_comparison.csv`)
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          toast.success('Comparison data exported as CSV!')
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors"
                        title="Export as CSV"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          if (!results) return
                          const jsonData = JSON.stringify(results, null, 2)
                          const blob = new Blob([jsonData], { type: 'application/json' })
                          const url = window.URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.href = url
                          link.setAttribute('download', `${results.ticker}_comparison.json`)
                          document.body.appendChild(link)
                          link.click()
                          link.remove()
                          window.URL.revokeObjectURL(url)
                          toast.success('JSON exported successfully!')
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors"
                        title="Export as JSON"
                      >
                        <span className="material-symbols-outlined text-[18px]">code</span>
                        Export JSON
                      </button>
                      <button
                        onClick={() => {
                          addToWatchlist()
                        }}
                        disabled={!results}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add to Watchlist"
                      >
                        <span className="material-symbols-outlined text-[18px]">star</span>
                        Watchlist
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Metrics Cards */}
              {results && results.model_metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* LSTM RMSE */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <p className="text-text-secondary text-sm font-medium mb-1">LSTM RMSE</p>
                    <h3 className="text-3xl font-bold text-white font-mono">{results.model_metrics.lstm.rmse.toFixed(4)}</h3>
                    <p className="text-xs text-text-secondary mt-2">Lower is better</p>
                  </motion.div>

                  {/* RNN RMSE */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <p className="text-text-secondary text-sm font-medium mb-1">RNN RMSE</p>
                    <h3 className="text-3xl font-bold text-white font-mono">{results.model_metrics.rnn.rmse.toFixed(4)}</h3>
                    <p className="text-xs text-text-secondary mt-2">Lower is better</p>
                  </motion.div>

                  {/* LSTM Accuracy */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <p className="text-text-secondary text-sm font-medium mb-1">LSTM Accuracy</p>
                    <h3 className="text-3xl font-bold text-white font-mono">{results.model_metrics.lstm.accuracy.toFixed(2)}%</h3>
                    <p className="text-xs text-text-secondary mt-2">Higher is better</p>
                  </motion.div>

                  {/* RNN Accuracy */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <p className="text-text-secondary text-sm font-medium mb-1">RNN Accuracy</p>
                    <h3 className="text-3xl font-bold text-white font-mono">{results.model_metrics.rnn.accuracy.toFixed(2)}%</h3>
                    <p className="text-xs text-text-secondary mt-2">Higher is better</p>
                  </motion.div>
                </div>
              )}

              {/* Chart */}
              {results && (
                <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Price Comparison Chart</h2>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        <span className="text-text-secondary">Actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-text-secondary">LSTM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent-rnn"></div>
                        <span className="text-text-secondary">RNN</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full flex flex-col" style={{ minHeight: '500px', height: '500px' }}>
                    <div className="absolute left-6 top-6 text-xs text-text-secondary z-10">Price (USD)</div>
                    {chartData && chartData.length > 0 ? (
                      <div className="flex-1 mt-6 ml-8 w-full pr-8" style={{ height: '450px' }}>
                        <ResponsiveContainer width="100%" height="100%" debounce={1}>
                          <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#233648" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#92adc9"
                              tick={{ fill: '#92adc9', fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval="preserveStartEnd"
                            />
                            <YAxis 
                              stroke="#92adc9"
                              tick={{ fill: '#92adc9', fontSize: 12 }}
                              label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#92adc9' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(22, 32, 42, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Legend 
                              wrapperStyle={{ color: '#fff', paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="actual" 
                              stroke="#ffffff" 
                              strokeWidth={2}
                              dot={false}
                              connectNulls={false}
                              name="Actual"
                              isAnimationActive={true}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="lstm" 
                              stroke="#137fec" 
                              strokeWidth={2}
                              dot={false}
                              connectNulls={true}
                              name="LSTM Predictions"
                              isAnimationActive={true}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="rnn" 
                              stroke="#ff2a6d" 
                              strokeWidth={2}
                              dot={false}
                              connectNulls={true}
                              name="RNN Predictions"
                              isAnimationActive={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-text-secondary">
                        No chart data available. Please run comparison.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              {results && results.model_metrics && (
                <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Detailed Metrics Comparison</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-dark">
                      <thead className="bg-background-dark">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Metric</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">LSTM</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">RNN</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Winner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        <tr className="hover:bg-background-dark transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">RMSE</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.lstm.rmse.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.rnn.rmse.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {results.model_metrics.lstm.rmse < results.model_metrics.rnn.rmse ? 'LSTM' : 'RNN'}
                          </td>
                        </tr>
                        <tr className="hover:bg-background-dark transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">MAE</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.lstm.mae.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.rnn.mae.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {results.model_metrics.lstm.mae < results.model_metrics.rnn.mae ? 'LSTM' : 'RNN'}
                          </td>
                        </tr>
                        <tr className="hover:bg-background-dark transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Accuracy</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.lstm.accuracy.toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.rnn.accuracy.toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {results.model_metrics.lstm.accuracy > results.model_metrics.rnn.accuracy ? 'LSTM' : 'RNN'}
                          </td>
                        </tr>
                        <tr className="hover:bg-background-dark transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">R² Score</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.lstm.r2_score.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{results.model_metrics.rnn.r2_score.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {results.model_metrics.lstm.r2_score > results.model_metrics.rnn.r2_score ? 'LSTM' : 'RNN'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!results && !loading && (
                <div className="bg-surface-dark border border-border-dark rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">analytics</span>
                  <p className="text-text-secondary text-lg mb-2">No comparison data yet</p>
                  <p className="text-text-secondary text-sm">Enter a stock symbol and click "Compare Models" to begin</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
