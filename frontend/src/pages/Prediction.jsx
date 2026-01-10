import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

export default function Prediction() {
  const navigate = useNavigate()
  // Default values (matching backend defaults)
  const DEFAULT_VALUES = {
    ticker: 'TSLA',
    model: 'LSTM', // Backend API default is "LSTM" (matches backend/prediction_service.py)
    period: '3y', // Backend default is "3y" (matches backend/api/routes/predictions.py)
    lookback: 60, // Backend SEQUENCE_LENGTH default is 60
    epochs: 100, // Backend default_epochs is 100
    batchSize: 32 // Backend default_batch_size is 32
  }

  const [formData, setFormData] = useState({
    ticker: DEFAULT_VALUES.ticker,
    model: DEFAULT_VALUES.model,
    period: DEFAULT_VALUES.period,
    lookback: DEFAULT_VALUES.lookback,
    epochs: DEFAULT_VALUES.epochs,
    batchSize: DEFAULT_VALUES.batchSize
  })

  const resetToDefaults = () => {
    setFormData({
      ticker: DEFAULT_VALUES.ticker,
      model: DEFAULT_VALUES.model,
      period: DEFAULT_VALUES.period,
      lookback: DEFAULT_VALUES.lookback,
      epochs: DEFAULT_VALUES.epochs,
      batchSize: DEFAULT_VALUES.batchSize
    })
    toast.success('Reset to default values')
  }
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([
    '[INFO] Ready to fetch stock data...',
    '[INFO] Enter ticker symbol and click Train & Predict'
  ])

  const addLog = (message, type = 'INFO') => {
    const prefix = type === 'INFO' ? '[INFO]' : type === 'LSTM' ? '[LSTM]' : type === 'RNN' ? '[RNN]' : '[DONE]'
    setLogs(prev => [...prev, `${prefix} ${message}`])
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
      addLog('Preprocessing data (Scaling 0-1)...')
      addLog(`Starting ${formData.model} model training...`)
      addLog(`Training with ${formData.epochs} epochs, batch size ${formData.batchSize}, sequence length ${formData.lookback}`)

      const response = await api.post('/predictions/predict', {
        ticker: formData.ticker.toUpperCase(),
        model: formData.model === 'Both' ? 'LSTM' : formData.model,
        period: formData.period,
        prediction_days: 30,
        epochs: formData.epochs,
        batch_size: formData.batchSize,
        sequence_length: formData.lookback
      })
      
      console.log('Prediction response:', response.data)
      console.log('Historical data:', response.data?.historical_data)
      console.log('Future predictions:', response.data?.future_predictions)
      
      // Add real training completion logs
      if (response.data?.metrics) {
        const metrics = response.data.metrics
        addLog(`Training completed! Final loss: ${metrics.rmse?.toFixed(6) || 'N/A'}`, 'DONE')
        addLog(`Model accuracy: ${metrics.accuracy?.toFixed(2) || 'N/A'}%`, 'DONE')
        addLog(`RMSE: ${metrics.rmse?.toFixed(6) || 'N/A'}, MAE: ${metrics.mae?.toFixed(6) || 'N/A'}`, 'DONE')
      }
      
      setResults(response.data)
      toast.success('Prediction completed!')
      addLog('Prediction results generated successfully.', 'DONE')
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
        model: formData.model === 'Both' ? 'LSTM' : formData.model,
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

  // Build chart data with better error handling
  const chartData = useMemo(() => {
    if (!results || !results.historical_data || !results.future_predictions) {
      console.log('Chart data: Missing results or data structure', {
        hasResults: !!results,
        hasHistorical: !!results?.historical_data,
        hasFuture: !!results?.future_predictions
      })
      return []
    }

    try {
      const historical = (results.historical_data.dates || []).map((date, i) => ({
        date: typeof date === 'string' ? date.split('T')[0] : String(date),
        actual: results.historical_data.actual?.[i] ?? null,
        predicted: results.historical_data.predicted?.[i] ?? null,
        type: 'historical'
      }))

      const future = (results.future_predictions.dates || []).map((date, i) => ({
        date: typeof date === 'string' ? date.split('T')[0] : String(date),
        predicted: results.future_predictions.predictions?.[i] ?? null,
        actual: null,
        type: 'future'
      }))

      const combined = [...historical, ...future].filter(item => 
        item.date && (item.actual !== null || item.predicted !== null)
      )

      console.log('Chart data prepared:', {
        historicalCount: historical.length,
        futureCount: future.length,
        combinedCount: combined.length,
        sampleData: combined.slice(0, 3)
      })

      return combined
    } catch (error) {
      console.error('Error building chart data:', error)
      return []
    }
  }, [results])

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  return (
    <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark font-display text-white overflow-hidden">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark px-6 py-3 bg-surface-dark flex-shrink-0 z-20">
        <div className="flex items-center gap-4 text-white">
          <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg text-primary">
            <span className="material-symbols-outlined">candlestick_chart</span>
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] cursor-pointer" onClick={() => navigate('/')}>
            StockNeuro
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <div className="hidden md:flex gap-2 text-sm font-medium text-text-secondary">
            <span className="px-3 py-1 rounded-full bg-border-dark/50 text-white">Analysis</span>
            <span className="px-3 py-1 hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/comparison')}>History</span>
            <span className="px-3 py-1 hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/benchmarks')}>Settings</span>
          </div>
          <div className="h-8 w-[1px] bg-border-dark"></div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 ring-2 ring-border-dark bg-gradient-to-br from-blue-500 to-purple-500"></div>
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
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Timeframe</label>
                <span className="text-xs text-text-secondary/60">Default: 3 Years</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between bg-background-dark border rounded-lg p-2.5 cursor-pointer hover:border-text-secondary transition-colors ${
                  formData.period === DEFAULT_VALUES.period
                    ? 'border-border-dark'
                    : 'border-primary/50'
                }`}>
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
                    <option value="3y">3 Years</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border-dark w-full"></div>

            {/* Model Selection */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Model Architecture</label>
                <span className="text-xs text-text-secondary/60">Default: {DEFAULT_VALUES.model}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-background-dark p-1 rounded-lg border border-border-dark">
                <button
                  onClick={() => setFormData({ ...formData, model: 'LSTM' })}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    formData.model === 'LSTM' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  LSTM
                </button>
                <button
                  onClick={() => setFormData({ ...formData, model: 'RNN' })}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    formData.model === 'RNN' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  RNN
                </button>
                <button
                  onClick={() => setFormData({ ...formData, model: 'Both' })}
                  className={`px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    formData.model === 'Both' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Hyperparameters</label>
                <button
                  onClick={resetToDefaults}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  title="Reset to default values"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Reset
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm text-text-secondary">Look-back Window</span>
                    <span className="text-xs text-text-secondary/60">Default: {DEFAULT_VALUES.lookback} days</span>
                  </div>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                    formData.lookback === DEFAULT_VALUES.lookback 
                      ? 'bg-border-dark text-primary' 
                      : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {formData.lookback} days
                  </span>
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
                  <div className="flex flex-col">
                    <span className="text-sm text-text-secondary">Epochs</span>
                    <span className="text-xs text-text-secondary/60">Default: {DEFAULT_VALUES.epochs}</span>
                  </div>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                    formData.epochs === DEFAULT_VALUES.epochs 
                      ? 'bg-border-dark text-primary' 
                      : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {formData.epochs}
                  </span>
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
                  <div className="flex flex-col">
                    <span className="text-sm text-text-secondary">Batch Size</span>
                    <span className="text-xs text-text-secondary/60">Default: {DEFAULT_VALUES.batchSize}</span>
                  </div>
                  <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                    formData.batchSize === DEFAULT_VALUES.batchSize 
                      ? 'bg-border-dark text-primary' 
                      : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {formData.batchSize}
                  </span>
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
                  </h1>
                  <p className="text-text-secondary flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                    Market Open • {getCurrentDate()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {results && (
                    <>
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export CSV
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dark bg-surface-dark text-sm hover:bg-border-dark transition-colors">
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
                    <p className="text-text-secondary text-sm font-medium mb-1">Model Accuracy</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className={`text-3xl font-bold font-mono ${
                        results.metrics.accuracy >= 70 ? 'text-green-500' :
                        results.metrics.accuracy >= 50 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {results.metrics.accuracy?.toFixed(2) || 'N/A'}%
                      </h3>
                      {results.metrics.accuracy && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          results.metrics.accuracy >= 70 
                            ? 'text-green-500 bg-green-500/10' 
                            : results.metrics.accuracy >= 50
                            ? 'text-yellow-500 bg-yellow-500/10'
                            : 'text-red-500 bg-red-500/10'
                        }`}>
                          {results.metrics.accuracy >= 70 ? '✓ Good' : results.metrics.accuracy >= 50 ? '⚠ Fair' : '✗ Low'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      {results.metrics.accuracy >= 70 
                        ? 'Excellent accuracy achieved!' 
                        : results.metrics.accuracy >= 50
                        ? 'Moderate accuracy. Consider using default settings.'
                        : 'Low accuracy. Try using default hyperparameters (Reset button).'}
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
                    <p className="text-text-secondary text-sm font-medium mb-1">Root Mean Squared Error (RMSE)</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-white font-mono">{results.metrics.rmse?.toFixed(6) || 'N/A'}</h3>
                      <span className="text-xs text-text-secondary bg-border-dark px-1.5 py-0.5 rounded">
                        Lower is better
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">Root mean squared error - measures prediction accuracy.</p>
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
                    <p className="text-xs text-text-secondary mt-2">Consensus from both LSTM and RNN models.</p>
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
                  <div className="relative flex-1 p-6 w-full flex flex-col" style={{ minHeight: '500px', height: '500px' }}>
                    <div className="absolute left-6 top-6 text-xs text-text-secondary">Price (USD)</div>
                    {chartData && chartData.length > 0 ? (
                      <div className="flex-1 mt-6 ml-8 w-full" style={{ minHeight: '450px', height: '450px', width: 'calc(100% - 2rem)' }}>
                        <ResponsiveContainer width="100%" height={450}>
                          <LineChart 
                            data={chartData} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#233648" />
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
                              domain={['dataMin', 'dataMax']}
                              label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#92adc9' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                border: '1px solid #233648',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              labelStyle={{ color: '#fff' }}
                              formatter={(value, name) => {
                                if (value === null || value === undefined) return ['N/A', name]
                                return [`$${Number(value).toFixed(2)}`, name]
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line
                              type="monotone"
                              dataKey="actual"
                              stroke="#137fec"
                              strokeWidth={3}
                              name="Actual"
                              dot={false}
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
                              connectNulls={false}
                              isAnimationActive={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center mt-6 ml-8">
                        <div className="text-center text-text-secondary">
                          <span className="material-symbols-outlined text-4xl mb-2">show_chart</span>
                          <p className="text-lg font-semibold mb-2">No chart data available</p>
                          <p className="text-sm mt-1">Data structure: {results ? 'Results exist' : 'No results'}</p>
                          <p className="text-sm">Historical: {results?.historical_data ? 'Yes' : 'No'}</p>
                          <p className="text-sm">Future: {results?.future_predictions ? 'Yes' : 'No'}</p>
                          <p className="text-sm">Chart data length: {chartData?.length || 0}</p>
                          <p className="text-sm mt-2">Check browser console (F12) for details</p>
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
                          <span className="text-text-secondary text-sm">Model Type</span>
                          <span className="text-white text-sm font-mono">{results.model_type || formData.model}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Optimizer</span>
                          <span className="text-white text-sm font-mono">Adam (lr=0.0008)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Loss Function</span>
                          <span className="text-white text-sm font-mono">Huber</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Dropout Rate</span>
                          <span className="text-white text-sm font-mono">0.2</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Epochs</span>
                          <span className="text-white text-sm font-mono">{formData.epochs}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Batch Size</span>
                          <span className="text-white text-sm font-mono">{formData.batchSize}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                          <span className="text-text-secondary text-sm">Sequence Length</span>
                          <span className="text-white text-sm font-mono">{formData.lookback} days</span>
                        </div>
                        {results.metrics?.accuracy !== undefined && (
                          <div className="flex justify-between py-2 border-b border-border-dark/50">
                            <span className="text-text-secondary text-sm">Model Accuracy</span>
                            <span className={`text-sm font-mono font-bold ${
                              results.metrics.accuracy >= 70 ? 'text-green-500' :
                              results.metrics.accuracy >= 50 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {results.metrics.accuracy.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2">
                          <span className="text-text-secondary text-sm">Training Samples</span>
                          <span className="text-white text-sm font-mono">{results.training_samples || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity / Logs */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-white font-bold text-lg">System Logs</h4>
                    <div className="bg-surface-dark border border-border-dark rounded-lg p-4 h-full max-h-[300px] overflow-y-auto font-mono text-xs text-text-secondary">
                      {logs.length === 0 ? (
                        <div className="text-text-secondary/60 italic">No logs yet. Start training to see progress...</div>
                      ) : (
                        logs.map((log, index) => {
                          const isInfo = log.includes('[INFO]')
                          const isLSTM = log.includes('[LSTM]') || log.toLowerCase().includes('lstm')
                          const isRNN = log.includes('[RNN]') || log.toLowerCase().includes('rnn')
                          const isDone = log.includes('[DONE]') || log.includes('completed') || log.includes('successfully')
                          const isError = log.includes('[ERROR]') || log.includes('Error:') || log.toLowerCase().includes('error')
                          const isTraining = log.includes('Epoch') || log.includes('Training') || log.includes('epoch')
                          
                          let color = 'text-text-secondary'
                          if (isInfo) color = 'text-primary'
                          else if (isLSTM) color = 'text-accent-lstm'
                          else if (isRNN) color = 'text-accent-rnn'
                          else if (isDone) color = 'text-green-500'
                          else if (isError) color = 'text-red-500'
                          else if (isTraining) color = 'text-yellow-500'
                          
                          return (
                            <div key={index} className={`flex gap-2 mb-1 ${isDone ? 'font-semibold' : ''}`}>
                              <span className={color}>
                                {log.match(/^\[.*?\]/)?.[0] || log.split(' ')[0]}
                              </span>
                              <span className={isDone ? 'text-white' : ''}>
                                {log.replace(/^\[.*?\]\s*/, '')}
                              </span>
                            </div>
                          )
                        })
                      )}
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
