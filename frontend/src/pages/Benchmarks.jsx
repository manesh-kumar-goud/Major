import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function Benchmarks() {
  const navigate = useNavigate()
  const [benchmarks, setBenchmarks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBenchmarks()
  }, [])

  const fetchBenchmarks = async () => {
    try {
      const response = await api.get('/benchmarks/performance')
      setBenchmarks(response.data)
    } catch (error) {
      toast.error('Failed to fetch benchmarks')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBenchmarks()
    toast.success('Benchmarks refreshed!')
  }

  const handleExport = () => {
    if (!benchmarks) return
    const jsonData = JSON.stringify(benchmarks, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `benchmarks_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('Benchmarks exported successfully!')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
          <p className="text-text-secondary mt-4">Loading benchmarks...</p>
        </div>
      </div>
    )
  }

  const MetricCard = ({ icon, label, value, color = "primary", trend }) => {
    const colorClasses = {
      primary: 'text-primary',
      green: 'text-accent-lstm',
      orange: 'text-accent-rnn',
      purple: 'text-purple-500'
    }
    const iconColor = colorClasses[color] || colorClasses.primary
    
    return (
    <div className="bg-background-dark border border-border-dark rounded-lg p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className={`material-symbols-outlined text-[32px] ${iconColor}`}>{icon}</span>
      </div>
      <div className="relative">
        <p className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-2xl font-bold font-mono ${
            color === 'primary' ? 'text-primary' : 
            color === 'green' ? 'text-accent-lstm' : 
            color === 'orange' ? 'text-accent-rnn' : 'text-white'
          }`}>
            {value}
          </h3>
          {trend && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              trend > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
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
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-xl mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">query_stats</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Performance Benchmarks
          </h1>
          <p className="text-text-secondary text-lg">
            Compare LSTM and RNN model performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          {benchmarks && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">download</span>
              Export JSON
            </button>
          )}
        </div>
      </motion.div>

      {benchmarks && (
        <div className="grid md:grid-cols-2 gap-6">
          {['lstm', 'rnn'].map((model, index) => {
            const data = benchmarks.benchmarks[model]
            const isLSTM = model === 'lstm'
            return (
              <motion.div
                key={model}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 p-6 opacity-5 ${
                  isLSTM ? 'text-accent-lstm' : 'text-accent-rnn'
                }`}>
                  <span className="material-symbols-outlined text-[80px]">
                    {isLSTM ? 'trending_up' : 'show_chart'}
                  </span>
                </div>

                {/* Header */}
                <div className="relative mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${
                      isLSTM ? 'bg-accent-lstm/20' : 'bg-accent-rnn/20'
                    }`}>
                      <span className={`material-symbols-outlined text-2xl ${
                        isLSTM ? 'text-accent-lstm' : 'text-accent-rnn'
                      }`}>
                        {isLSTM ? 'trending_up' : 'show_chart'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white uppercase">{model}</h2>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 relative">
                  <MetricCard
                    icon="trending_up"
                    label="Accuracy"
                    value={`${data.accuracy}%`}
                    color="green"
                    trend={2.3}
                  />
                  <MetricCard
                    icon="query_stats"
                    label="RMSE"
                    value={data.rmse}
                    color="primary"
                    trend={-12}
                  />
                  <MetricCard
                    icon="error_med"
                    label="MAE"
                    value={data.mae}
                    color="orange"
                  />
                  <MetricCard
                    icon="bar_chart"
                    label="R² Score"
                    value={data.r2_score}
                    color="purple"
                  />
                </div>

                {/* Additional Metrics */}
                <div className="mt-4 pt-4 border-t border-border-dark space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      Training Time
                    </span>
                    <span className="text-white font-mono font-bold">{data.training_time_seconds}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">storage</span>
                      Memory Usage
                    </span>
                    <span className="text-white font-mono font-bold">{data.memory_usage_mb} MB</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Comparison Section */}
      {benchmarks && benchmarks.comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            Model Comparison Winners
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background-dark border border-border-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-accent-lstm">target</span>
                <span className="text-text-secondary text-sm font-medium">Best Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {benchmarks.comparison.best_accuracy}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {benchmarks.benchmarks[benchmarks.comparison.best_accuracy.toLowerCase()]?.accuracy}%
              </div>
            </div>
            <div className="bg-background-dark border border-border-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-accent-rnn">speed</span>
                <span className="text-text-secondary text-sm font-medium">Fastest Training</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {benchmarks.comparison.fastest_training}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {benchmarks.benchmarks[benchmarks.comparison.fastest_training.toLowerCase()]?.training_time_seconds}s
              </div>
            </div>
            <div className="bg-background-dark border border-border-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <span className="text-text-secondary text-sm font-medium">Fastest Inference</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {benchmarks.comparison.fastest_inference}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {benchmarks.benchmarks[benchmarks.comparison.fastest_inference.toLowerCase()]?.inference_time_ms}ms
              </div>
            </div>
            <div className="bg-background-dark border border-border-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-purple-500">memory</span>
                <span className="text-text-secondary text-sm font-medium">Lowest Memory</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {benchmarks.comparison.lowest_memory}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {benchmarks.benchmarks[benchmarks.comparison.lowest_memory.toLowerCase()]?.memory_usage_mb} MB
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Charts */}
      {benchmarks && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Accuracy & R² Score Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Accuracy & R² Score Comparison
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      metric: 'Accuracy',
                      LSTM: benchmarks.benchmarks.lstm.accuracy,
                      RNN: benchmarks.benchmarks.rnn.accuracy
                    },
                    {
                      metric: 'R² Score',
                      LSTM: benchmarks.benchmarks.lstm.r2_score * 100,
                      RNN: benchmarks.benchmarks.rnn.r2_score * 100
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#233648" />
                  <XAxis dataKey="metric" stroke="#92adc9" tick={{ fill: '#92adc9' }} />
                  <YAxis stroke="#92adc9" tick={{ fill: '#92adc9' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(22, 32, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="LSTM" fill="#137fec" />
                  <Bar dataKey="RNN" fill="#ff2a6d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Error Metrics Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">error</span>
              Error Metrics (Lower is Better)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      metric: 'RMSE',
                      LSTM: benchmarks.benchmarks.lstm.rmse,
                      RNN: benchmarks.benchmarks.rnn.rmse
                    },
                    {
                      metric: 'MAE',
                      LSTM: benchmarks.benchmarks.lstm.mae,
                      RNN: benchmarks.benchmarks.rnn.mae
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#233648" />
                  <XAxis dataKey="metric" stroke="#92adc9" tick={{ fill: '#92adc9' }} />
                  <YAxis stroke="#92adc9" tick={{ fill: '#92adc9' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(22, 32, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="LSTM" fill="#137fec" />
                  <Bar dataKey="RNN" fill="#ff2a6d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* System Info */}
      {benchmarks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            System Information
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-xs uppercase tracking-wider">Data Source</span>
              <span className="text-white font-medium">{benchmarks.data_source || 'RapidAPI Yahoo Finance'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-xs uppercase tracking-wider">Models Available</span>
              <span className="text-white font-medium">LSTM, RNN</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-xs uppercase tracking-wider">Last Updated</span>
              <span className="text-white font-medium">
                {benchmarks.last_updated ? new Date(benchmarks.last_updated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  )
}
