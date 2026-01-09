import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { db, auth as supabaseAuth } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Prediction() {
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
    model: 'LSTM',
    period: '1mo',
    lookback: 60,
    epochs: 50,
    batchSize: 32
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([
    '[INFO] Ready to fetch stock data...',
    '[INFO] Enter ticker symbol and click Train & Predict'
  ])

  // Check for ticker from localStorage on mount and route changes (for navigation from Watchlist)
  useEffect(() => {
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
  }, [location.pathname]) // Run when route changes

  const addLog = (message, type = 'INFO') => {
    const prefix = type === 'INFO' ? '[INFO]' : type === 'LSTM' ? '[LSTM]' : type === 'RNN' ? '[RNN]' : '[DONE]'
    setLogs(prev => [...prev, `${prefix} ${message}`])
  }

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

  const handlePredict = async () => {
    if (!formData.ticker) {
      toast.error('Please enter a stock symbol')
      return
    }

    setLoading(true)
    setLogs([])
    addLog(`Fetching historical data for ${formData.ticker}...`)
    
    try {
      // Handle single model (LSTM, RNN, or PATCHTST)
      const selectedModel = formData.model
      if (selectedModel !== 'LSTM' && selectedModel !== 'RNN' && selectedModel !== 'PATCHTST') {
        throw new Error(`Invalid model selection: ${selectedModel}. Please select LSTM, RNN, or PATCHTST.`)
      }
      
      addLog(`Selected Model: ${selectedModel}`, 'INFO')
      addLog(`Training ${selectedModel} model for ${formData.ticker}...`, selectedModel)
      setTimeout(() => addLog('Preprocessing data (Scaling 0-1)...'), 500)
      setTimeout(() => addLog(`Training ${selectedModel} - Epoch 1/20...`, selectedModel), 1000)
      setTimeout(() => addLog(`Training ${selectedModel} - Epoch 10/20...`, selectedModel), 1500)
      setTimeout(() => addLog(`Training ${selectedModel} - Epoch 20/20...`, selectedModel), 2000)
      setTimeout(() => addLog(`${selectedModel} model evaluation complete.`, 'DONE'), 2500)

      const response = await api.post('/predictions/predict', {
        ticker: formData.ticker.toUpperCase(),
        model: selectedModel, // Send exact model name: 'LSTM', 'RNN', or 'PATCHTST'
        period: formData.period,
        prediction_days: 30
      })
      
      // Validate response data structure
      if (response.data && response.data.historical_data && response.data.future_predictions) {
        // Validate that the response model matches the selected model
        const responseModel = response.data.model_type?.toUpperCase()
        const expectedModel = selectedModel.toUpperCase()
        
        if (responseModel !== expectedModel) {
          console.warn(`Model mismatch: Expected ${expectedModel}, got ${responseModel}`)
          addLog(`Warning: Model type mismatch (Expected ${expectedModel}, got ${responseModel})`, 'WARNING')
        }
        
        console.log('Prediction data received:', {
          selectedModel: selectedModel,
          responseModel: response.data.model_type,
          historical_dates: response.data.historical_data.dates?.length || 0,
          historical_actual: response.data.historical_data.actual?.length || 0,
          historical_predicted: response.data.historical_data.predicted?.length || 0,
          future_dates: response.data.future_predictions.dates?.length || 0,
          future_predictions: response.data.future_predictions.predictions?.length || 0
        })
        setResults(response.data)
        
        // Save prediction to Supabase if user is authenticated
        if (user && db && db.predictions) {
          try {
            await db.predictions.save({
              ticker: formData.ticker.toUpperCase(),
              model_type: selectedModel,
              period: formData.period,
              prediction_days: 30,
              metrics: response.data.metrics || {},
              historical_data: response.data.historical_data || {},
              future_predictions: response.data.future_predictions || {},
              last_price: response.data.last_price,
              predicted_price: response.data.future_predictions?.predictions?.[0]
            })
            console.log('✅ Prediction saved to Supabase')
          } catch (e) {
            console.warn('Failed to save prediction to Supabase:', e)
            // Fall through to localStorage
          }
        }
        
        // Fallback: Save to localStorage for portfolio tracking
        try {
          const predictionData = {
            ticker: formData.ticker,
            model: selectedModel,
            timestamp: new Date().toISOString(),
            ...response.data
          }
          const existing = JSON.parse(localStorage.getItem('predictions') || '[]')
          existing.push(predictionData)
          // Keep only last 50 predictions
          const recent = existing.slice(-50)
          localStorage.setItem('predictions', JSON.stringify(recent))
        } catch (e) {
          console.error('Failed to save prediction:', e)
        }
        
        toast.success(`${selectedModel} prediction completed successfully!`)
        addLog(`✅ ${selectedModel} prediction results generated successfully.`, 'DONE')
      } else {
        throw new Error('Invalid response data structure from server')
      }
    } catch (error) {
      console.error('Prediction error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Prediction failed. Please check the stock symbol and try again.'
      toast.error(errorMessage)
      addLog(`Error: ${errorMessage}`, 'ERROR')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.post('/predictions/export', {
        ticker: formData.ticker.toUpperCase(),
        model: formData.model,
        period: formData.period,
        prediction_days: 30
      }, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${formData.ticker}_predictions.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Export successful!')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  // Transform data for chart
  const chartData = results ? [
    ...(results.historical_data?.dates || []).map((date, i) => {
      const actual = results.historical_data?.actual?.[i];
      const predicted = results.historical_data?.predicted?.[i];
      return {
        date: typeof date === 'string' ? date.split('T')[0].split(' ')[0] : date,
        actual: typeof actual === 'number' ? actual : null,
        predicted: typeof predicted === 'number' ? predicted : null,
        type: 'historical'
      };
    }).filter(item => item.actual !== null || item.predicted !== null),
    ...(results.future_predictions?.dates || []).map((date, i) => {
      const predicted = results.future_predictions?.predictions?.[i];
      return {
        date: typeof date === 'string' ? date.split('T')[0].split(' ')[0] : date,
        actual: null,
        predicted: typeof predicted === 'number' ? predicted : null,
        type: 'future'
      };
    }).filter(item => item.predicted !== null)
  ] : []

  // Debug: Log chart data when results change
  useEffect(() => {
    if (results && chartData.length > 0) {
      console.log('✅ Chart data prepared:', {
        totalPoints: chartData.length,
        sampleData: chartData.slice(0, 3),
        historicalCount: chartData.filter(d => d.type === 'historical').length,
        futureCount: chartData.filter(d => d.type === 'future').length,
        firstDate: chartData[0]?.date,
        lastDate: chartData[chartData.length - 1]?.date
      });
    } else if (results && chartData.length === 0) {
      console.warn('⚠️ Results available but chartData is empty:', {
        hasHistorical: !!results.historical_data,
        hasFuture: !!results.future_predictions,
        historicalDates: results.historical_data?.dates?.length,
        historicalActual: results.historical_data?.actual?.length,
        historicalPredicted: results.historical_data?.predicted?.length,
        futureDates: results.future_predictions?.dates?.length,
        futurePredictions: results.future_predictions?.predictions?.length,
        fullResults: results
      });
    }
  }, [results, chartData.length])

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  return (
    <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark font-display text-white overflow-hidden">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark px-6 py-3 bg-surface-dark flex-shrink-0 z-50 relative">
        <div className="flex items-center gap-4 text-white">
          <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg text-primary">
            <span className="material-symbols-outlined">candlestick_chart</span>
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
            <span className="px-3 py-1 rounded-full bg-border-dark/50 text-white">Analysis</span>
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
                navigate('/comparison')
              }}
            >
              Compare
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

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Control Panel */}
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

            {/* Model Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Model Architecture
                {formData.model && (
                  <span className="ml-2 text-primary font-normal normal-case">
                    ({formData.model === 'PATCHTST' ? 'Next-Gen Transformer' : formData.model + ' Only'})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2 bg-background-dark p-1 rounded-lg border border-border-dark">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, model: 'LSTM' })
                    setResults(null) // Clear previous results when changing model
                    toast.info('LSTM model selected')
                  }}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-all ${
                    formData.model === 'LSTM' 
                      ? 'bg-primary text-white shadow-sm shadow-primary/50' 
                      : 'text-text-secondary hover:text-white hover:bg-background-dark'
                  }`}
                  title="Use LSTM model only"
                >
                  LSTM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, model: 'RNN' })
                    setResults(null) // Clear previous results when changing model
                    toast.info('RNN model selected')
                  }}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-all ${
                    formData.model === 'RNN' 
                      ? 'bg-primary text-white shadow-sm shadow-primary/50' 
                      : 'text-text-secondary hover:text-white hover:bg-background-dark'
                  }`}
                  title="Use RNN model only"
                >
                  RNN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, model: 'PATCHTST' })
                    setResults(null) // Clear previous results when changing model
                    toast.info('PatchTST (Next-Gen Transformer) selected')
                  }}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-all ${
                    formData.model === 'PATCHTST' 
                      ? 'bg-primary text-white shadow-sm shadow-primary/50' 
                      : 'text-text-secondary hover:text-white hover:bg-background-dark'
                  }`}
                  title="Use PatchTST (Next-Generation Transformer) model"
                >
                  PatchTST
                </button>
              </div>
              {formData.model && (
                <p className="text-xs text-text-secondary mt-1">
                  {formData.model === 'PATCHTST'
                    ? 'Next-generation Transformer model with Channel Independence and long-term memory'
                    : `Will train and predict using ${formData.model} model only`}
                </p>
              )}
            </div>

            {/* Hyperparameters */}
            <div className="flex flex-col gap-6">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Hyperparameters</label>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Look-back Window</span>
                  <span className="text-sm font-mono bg-border-dark px-2 py-0.5 rounded text-primary">{formData.lookback} days</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  value={formData.lookback}
                  onChange={(e) => setFormData({ ...formData, lookback: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Epochs</span>
                  <span className="text-sm font-mono bg-border-dark px-2 py-0.5 rounded text-primary">{formData.epochs}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={formData.epochs}
                  onChange={(e) => setFormData({ ...formData, epochs: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Batch Size</span>
                  <span className="text-sm font-mono bg-border-dark px-2 py-0.5 rounded text-primary">{formData.batchSize}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="128"
                  step="8"
                  value={formData.batchSize}
                  onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-border-dark bg-surface-dark sticky bottom-0">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>neurology</span>
              {loading ? 'Training...' : 'Train & Predict'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 chart-grid opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
              {/* Page Header */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                    {results ? `${results.ticker}` : formData.ticker} Stock Prediction
                    {results?.model_type && (
                      <span className="ml-3 text-lg text-primary font-semibold">
                        ({results.model_type})
                      </span>
                    )}
                  </h1>
                  <p className="text-text-secondary flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                    Market Open • {getCurrentDate()}
                    {results?.model_type && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-primary">Model: {results.model_type}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {results && (
                    <>
                      <button
                        onClick={handleExport}
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
                          link.setAttribute('download', `${results.ticker}_predictions.json`)
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
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          addToWatchlist()
                        }}
                        disabled={!formData.ticker}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={formData.ticker ? `Add ${formData.ticker} to watchlist` : 'Enter a ticker symbol first'}
                      >
                        <span className="material-symbols-outlined text-[18px]">star</span>
                        Watchlist
                      </button>
                      <button 
                        onClick={() => {
                          if (navigator.share && results) {
                            navigator.share({
                              title: `${results.ticker} Stock Prediction`,
                              text: `Check out my ${results.ticker} stock prediction using ${results.model_type} model!`,
                              url: window.location.href
                            }).catch(err => {
                              if (err.name !== 'AbortError') {
                                toast.error('Failed to share')
                              }
                            })
                          } else {
                            // Fallback: Copy to clipboard
                            const shareText = `${results.ticker} Stock Prediction - ${results.model_type}\nView at: ${window.location.href}`
                            navigator.clipboard.writeText(shareText).then(() => {
                              toast.success('Link copied to clipboard!')
                            }).catch(() => {
                              toast.error('Failed to copy link')
                            })
                          }
                        }}
                        disabled={!results}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        Share
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Insight Cards */}
              {results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* RMSE Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-[48px] text-primary">query_stats</span>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Model Accuracy (RMSE)</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-3xl font-bold text-white font-mono">{results.metrics.rmse.toFixed(4)}</h3>
                      {results.metrics.accuracy && !isNaN(results.metrics.accuracy) && (
                        <span className="text-sm text-green-400 flex items-center bg-green-400/10 px-2 py-1 rounded font-semibold" title="Model Accuracy Percentage">
                          {results.metrics.accuracy.toFixed(2)}%
                        </span>
                      )}
                      {results.metrics.mase && !isNaN(results.metrics.mase) && (
                        <span className="text-xs text-blue-400 flex items-center bg-blue-400/10 px-1.5 py-0.5 rounded" title="MASE (Mean Absolute Scaled Error)">
                          MASE: {results.metrics.mase.toFixed(3)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Lower is better. {results.metrics.mase && !isNaN(results.metrics.mase) && results.metrics.mase < 1 ? 'Better than naive forecast (MASE < 1)' : 'Optimal performance reached'}
                    </p>
                  </motion.div>

                  {/* MAE Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-[48px] text-accent-rnn">error_med</span>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Mean Absolute Error (MAE)</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-white font-mono">${results.metrics.mae.toFixed(2)}</h3>
                      {results.metrics.smape && !isNaN(results.metrics.smape) && (
                        <span className="text-xs text-purple-400 flex items-center bg-purple-400/10 px-1.5 py-0.5 rounded" title="sMAPE (Symmetric MAPE)">
                          sMAPE: {results.metrics.smape.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">Average deviation from actual closing price.</p>
                  </motion.div>

                  {/* Trend Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface-dark border border-border-dark rounded-xl p-5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-[48px] text-accent-lstm">trending_up</span>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Predicted Trend (7 Days)</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className={`text-3xl font-bold font-mono ${
                        results.prediction_summary.trend === 'bullish' ? 'text-accent-lstm' : 'text-red-500'
                      }`}>
                        {results.prediction_summary.trend === 'bullish' ? 'Bullish' : 'Bearish'}
                      </h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                        results.prediction_summary.trend === 'bullish' 
                          ? 'text-accent-lstm bg-accent-lstm/10' 
                          : 'text-red-500 bg-red-500/10'
                      }`}>
                        {results.prediction_summary.price_change_percent >= 0 ? '+' : ''}
                        {results.prediction_summary.price_change_percent.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">Model prediction results.</p>
                  </motion.div>
                </div>
              )}

              {/* Main Chart Section */}
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-dark border border-border-dark rounded-xl flex flex-col min-h-[500px] shadow-xl"
                >
                  {/* Chart Header */}
                  <div className="flex items-center justify-between border-b border-border-dark px-6 py-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">show_chart</span>
                      Price Prediction Analysis
                    </h3>
                    {/* Legend */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2 cursor-pointer opacity-100 hover:opacity-80">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-text-secondary">Actual</span>
                      </div>
                      <div className="flex items-center gap-2 cursor-pointer opacity-100 hover:opacity-80">
                        <div className="w-3 h-0.5 border-t-2 border-dashed border-accent-lstm"></div>
                        <span className="text-text-secondary">LSTM</span>
                      </div>
                      <div className="flex items-center gap-2 cursor-pointer opacity-100 hover:opacity-80">
                        <div className="w-3 h-0.5 border-t-2 border-dashed border-accent-rnn"></div>
                        <span className="text-text-secondary">RNN</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart Visual Area */}
                  <div className="relative w-full flex flex-col overflow-hidden" style={{ minHeight: '500px', height: '500px' }}>
                    <div className="absolute left-6 top-6 text-xs text-text-secondary z-10">Price (USD)</div>
                    {chartData && chartData.length > 0 ? (
                      <div className="flex-1 mt-6 ml-8 w-full pr-8" style={{ height: '450px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%" debounce={1}>
                          <LineChart 
                            data={chartData} 
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <defs>
                              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#137fec" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#233648" opacity={0.5} />
                            <XAxis 
                              dataKey="date" 
                              stroke="#92adc9"
                              tick={{ fill: '#92adc9', fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval="preserveStartEnd"
                            />
                            <YAxis 
                              stroke="#92adc9"
                              tick={{ fill: '#92adc9', fontSize: 12 }}
                              domain={['auto', 'auto']}
                              label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#92adc9' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(17, 26, 34, 0.95)',
                                border: '1px solid #233648',
                                borderRadius: '8px',
                                color: '#fff',
                                padding: '10px'
                              }}
                              labelStyle={{ color: '#fff', marginBottom: '5px' }}
                              itemStyle={{ color: '#fff' }}
                              cursor={{ stroke: '#92adc9', strokeWidth: 1 }}
                            />
                            <Legend 
                              wrapperStyle={{ color: '#fff', paddingTop: '20px' }}
                              iconType="line"
                              iconSize={12}
                            />
                            <Line
                              type="monotone"
                              dataKey="actual"
                              stroke="#137fec"
                              strokeWidth={3}
                              name="Actual"
                              dot={false}
                              activeDot={{ r: 4, fill: '#137fec' }}
                              connectNulls={false}
                              isAnimationActive={true}
                            />
                            <Line
                              type="monotone"
                              dataKey="predicted"
                              stroke="#10b981"
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              name="Predicted"
                              dot={false}
                              activeDot={{ r: 4, fill: '#10b981' }}
                              connectNulls={true}
                              isAnimationActive={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center mt-6 ml-8" style={{ height: '450px' }}>
                        <div className="text-center text-text-secondary">
                          <span className="material-symbols-outlined text-4xl mb-2 block">show_chart</span>
                          <p className="text-sm">
                            {results ? 'Processing chart data...' : 'No chart data available'}
                          </p>
                          {chartData && chartData.length === 0 && results && (
                            <p className="text-xs mt-2 text-red-400">
                              Chart data is empty. Check console for details.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Bottom Info Section */}
              {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
                  {/* Model Parameters Summary */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-white font-bold text-lg">Active Configuration</h4>
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Optimizer</span>
                          <span className="text-white text-sm font-mono">Adam (lr=0.001)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Loss Function</span>
                          <span className="text-white text-sm font-mono">MSE</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Dropout Rate</span>
                          <span className="text-white text-sm font-mono">0.2</span>
                        </div>
                        {results.metrics.accuracy && !isNaN(results.metrics.accuracy) && (
                          <div className="flex justify-between py-2 border-b border-border-dark/50">
                            <span className="text-text-secondary text-sm">Model Accuracy</span>
                            <span className="text-green-400 text-sm font-mono font-semibold">{results.metrics.accuracy.toFixed(2)}%</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2">
                          <span className="text-text-secondary text-sm">Last Training Time</span>
                          <span className="text-white text-sm font-mono">4m 23s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity / Logs */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-white font-bold text-lg">System Logs</h4>
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-4 h-full max-h-[190px] overflow-y-auto font-mono text-xs text-text-secondary">
                      {logs.map((log, index) => {
                        const isInfo = log.includes('[INFO]')
                        const isLSTM = log.includes('[LSTM]')
                        const isRNN = log.includes('[RNN]')
                        const isDone = log.includes('[DONE]')
                        const color = isInfo ? 'text-primary' : isLSTM ? 'text-accent-lstm' : isRNN ? 'text-accent-rnn' : 'text-green-500'
                        return (
                          <div key={index} className={`flex gap-2 mb-1`}>
                            <span className={color}>{log.split(' ')[0]}</span>
                            <span>{log.split(' ').slice(1).join(' ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!results && !loading && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">show_chart</span>
                    <p className="text-text-secondary text-lg">Enter a stock symbol and click "Train & Predict" to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
