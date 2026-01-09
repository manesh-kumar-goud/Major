import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Portfolio() {
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState({
    totalBalance: 0,
    cashBalance: 0,
    invested: 0,
    totalValue: 0,
    todayPL: 0,
    totalReturnPercent: 0,
    isPositive: true
  })
  const [holdings, setHoldings] = useState([])
  const [chartData, setChartData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('1W')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolio()
    loadChartData()
  }, [])

  useEffect(() => {
    loadChartData()
  }, [selectedPeriod])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      const response = await api.get('/portfolio/overview')
      if (response.data) {
        setPortfolio({
          totalBalance: response.data.total_balance || 0,
          cashBalance: response.data.cash_balance || 0,
          invested: response.data.invested || 0,
          totalValue: response.data.total_value || 0,
          todayPL: response.data.today_pl || 0,
          totalReturnPercent: response.data.total_return_percent || 0,
          isPositive: response.data.is_positive !== false
        })
        setHoldings(response.data.holdings || [])
      }
    } catch (e) {
      console.error('Failed to load portfolio:', e)
      toast.error('Failed to load portfolio data')
      // Fallback to localStorage
      const saved = localStorage.getItem('portfolio')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          setPortfolio(data.portfolio || portfolio)
          setHoldings(data.holdings || [])
        } catch (err) {
          console.error('Failed to parse saved portfolio:', err)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadChartData = async () => {
    try {
      const response = await api.get(`/portfolio/history?period=${selectedPeriod}`)
      if (response.data && response.data.data) {
        setChartData(response.data.data)
      }
    } catch (e) {
      console.error('Failed to load chart data:', e)
      // Fallback to mock data
      setChartData(Array.from({ length: 7 }, (_, i) => ({
        date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: 140000 + Math.random() * 5000
      })))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-white">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio Overview</h1>
            <p className="text-text-secondary mt-1">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                loadPortfolio()
                loadChartData()
                toast.success('Portfolio refreshed')
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-dark border border-border-dark text-sm text-text-secondary hover:text-white hover:border-primary transition-colors"
              title="Refresh portfolio data"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Refresh</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-dark border border-border-dark text-sm text-text-secondary">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Top Row: Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Portfolio Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-surface-dark border border-border-dark rounded-2xl p-6 flex flex-col h-[400px]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-text-secondary text-sm font-medium mb-1">Total Balance</p>
                <h2 className="text-4xl font-bold text-white tracking-tight">${portfolio.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1 ${
                    portfolio.isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {portfolio.isPositive ? 'trending_up' : 'trending_down'}
                    </span>
                    ${portfolio.todayPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-text-secondary text-sm">Today's P&L</span>
                </div>
              </div>
              <div className="flex bg-background-dark rounded-lg p-1">
                {['1D', '1W', '1M', '1Y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      period === selectedPeriod ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#233648" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#92adc9"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#92adc9"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334b63', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#92adc9' }}
                      formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Balance']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#137fec" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#137fec' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">show_chart</span>
                    <p>Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Account Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Cash Balance</p>
                  <p className="text-white text-2xl font-bold">${portfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Invested</p>
                  <p className="text-white text-2xl font-bold">${portfolio.invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Total Return</p>
                  <p className={`text-2xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolio.totalReturnPercent >= 0 ? '+' : ''}{portfolio.totalReturnPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/prediction')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>New Prediction</span>
                </button>
                <button
                  onClick={() => navigate('/watchlist')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-background-dark border border-border-dark text-white rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">star</span>
                  <span>View Watchlist</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-dark border border-border-dark rounded-xl p-6"
        >
          <h3 className="text-white text-lg font-bold mb-4">Holdings</h3>
          {holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-dark">
                <thead className="bg-background-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Shares</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {holdings.map((holding, index) => (
                    <tr 
                      key={`${holding.symbol}-${index}`} 
                      className="hover:bg-background-dark transition-colors cursor-pointer"
                      onClick={() => {
                        localStorage.setItem('defaultTicker', holding.symbol)
                        navigate('/prediction')
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        <div>
                          <div>{holding.symbol}</div>
                          {holding.name && <div className="text-xs text-text-secondary">{holding.name}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{holding.shares}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${holding.price?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${holding.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        holding.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">inventory_2</span>
              <p className="text-text-secondary text-lg mb-2">No holdings yet</p>
              <p className="text-text-secondary text-sm mb-6">Start by making predictions and adding stocks to your watchlist.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/prediction')}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Make Prediction
                </button>
                <button
                  onClick={() => navigate('/watchlist')}
                  className="px-4 py-2 bg-surface-dark hover:bg-background-dark border border-border-dark text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View Watchlist
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

