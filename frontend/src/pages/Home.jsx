import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [popularStocks, setPopularStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    fetchPopularStocks()
  }, [])

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`)
      if (response.data && response.data.results) {
        setSearchResults(response.data.results)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      // If search fails, filter popular stocks locally
      const filtered = popularStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        (stock.name && stock.name.toLowerCase().includes(query.toLowerCase()))
      )
      setSearchResults(filtered)
      setShowSearchResults(true)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, popularStocks]) // Add popularStocks as dependency for fallback

  const fetchPopularStocks = async () => {
    try {
      const response = await api.get('/stocks/popular')
      if (response.data && response.data.stocks) {
        setPopularStocks(response.data.stocks)
      } else {
        console.warn('Unexpected API response format:', response.data)
        setPopularStocks([])
      }
    } catch (error) {
      console.error('Error fetching popular stocks:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch popular stocks'
      toast.error(errorMessage)
      setPopularStocks([]) // Set empty array to prevent crashes
    } finally {
      setLoading(false)
    }
  }

  // Format ticker data for display
  const formatTickerData = () => {
    if (!popularStocks || popularStocks.length === 0) return []
    
    // Create ticker items from popular stocks
    const tickers = []
    popularStocks.slice(0, 5).forEach(stock => {
      tickers.push({
        label: stock.symbol,
        value: stock.price,
        change: stock.change_percent,
        isPositive: stock.change_percent >= 0
      })
    })
    return tickers
  }

  const tickerData = formatTickerData()

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#233648] bg-[#111a22]">
        <div className="flex h-16 items-center px-6 border-b border-[#233648]">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">neurology</span>
            <span className="text-xl font-bold tracking-tight text-white">StockNeuro</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/prediction"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">model_training</span>
                <span className="text-sm font-medium">Model Training</span>
              </Link>
            </li>
            <li>
              <Link
                to="/comparison"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">compare_arrows</span>
                <span className="text-sm font-medium">LSTM vs RNN</span>
              </Link>
            </li>
            <li>
              <Link
                to="/benchmarks"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">database</span>
                <span className="text-sm font-medium">Data Sets</span>
              </Link>
            </li>
            <li>
              <Link
                to="/portfolio"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span className="text-sm font-medium">Portfolio</span>
              </Link>
            </li>
            <li>
              <Link
                to="/watchlist"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">star</span>
                <span className="text-sm font-medium">Watchlist</span>
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">api</span>
                <span className="text-sm font-medium">About</span>
              </Link>
            </li>
          </ul>
          <div className="mt-8 px-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">System</p>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-[#233648] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="text-sm font-medium">Support</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="border-t border-[#233648] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#1e293b] p-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Analyst</span>
              <span className="text-xs text-slate-400">Data Scientist</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex h-full flex-1 flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#233648] bg-[#111a22] px-6 lg:px-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-lg font-bold text-white">StockNeuro</span>
          </div>
          {/* Search / Breadcrumbs */}
          <div className="hidden lg:flex items-center text-slate-400 text-sm">
            <span>Overview</span>
            <span className="material-symbols-outlined text-base mx-2">chevron_right</span>
            <span className="text-white">Dashboard</span>
          </div>
          <div className="flex flex-1 justify-end gap-6 items-center">
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-[#233648] px-3 py-1.5 border border-[#334b63] relative">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
              <input
                className="bg-transparent border-none text-sm text-white focus:ring-0 placeholder-slate-500 w-48 outline-none"
                placeholder="Search stocks..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim()) {
                    setShowSearchResults(true)
                  } else {
                    setShowSearchResults(false)
                  }
                }}
                onFocus={() => {
                  if (searchQuery && searchResults.length > 0) {
                    setShowSearchResults(true)
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow click on results
                  setTimeout(() => setShowSearchResults(false), 200)
                }}
              />
              {searchLoading && (
                <span className="material-symbols-outlined text-slate-400 text-[16px] animate-spin">sync</span>
              )}
              {searchQuery && !searchLoading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery('')
                    setSearchResults([])
                    setShowSearchResults(false)
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              {showSearchResults && searchResults.length > 0 && (
                <div 
                  className="absolute top-full left-0 mt-2 w-full bg-[#1e293b] border border-[#334b63] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto min-w-[300px]"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                >
                  {searchResults.slice(0, 10).map((stock, index) => (
                    <button
                      key={`${stock.symbol}-${index}`}
                      type="button"
                      onClick={() => {
                        if (stock.symbol) {
                          localStorage.setItem('defaultTicker', stock.symbol)
                          setSearchQuery('')
                          setSearchResults([])
                          setShowSearchResults(false)
                          navigate(`/prediction`)
                        }
                      }}
                      className="w-full px-4 py-3 hover:bg-[#233648] flex items-center justify-between text-left transition-colors border-b border-[#334b63] last:border-b-0"
                    >
                      <div>
                        <div className="text-white font-medium">{stock.symbol || 'N/A'}</div>
                        {stock.name && <div className="text-xs text-slate-400">{stock.name}</div>}
                      </div>
                      {stock.price && (
                        <div className="text-white font-bold">${typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {showSearchResults && searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#1e293b] border border-[#334b63] rounded-lg shadow-xl z-50 p-4 min-w-[300px]">
                  <div className="text-slate-400 text-sm">No stocks found</div>
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/watchlist')}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#233648] text-white hover:bg-[#334b63] transition-colors"
              title="Watchlist"
            >
              <span className="material-symbols-outlined">star</span>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#233648] text-white hover:bg-[#334b63] transition-colors"
              title="Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            {user && (
              <button
                onClick={() => navigate('/profile')}
                className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500 cursor-pointer hover:ring-2 ring-primary transition-all"
                title="Profile"
              />
            )}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all text-sm font-medium"
                title="Login"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col w-full max-w-[1400px] mx-auto">
            {/* Enhanced Market Ticker */}
            {tickerData.length > 0 && (
              <div className="relative w-full overflow-hidden border-b border-[#233648] bg-[#0f161d]/50 h-12 flex items-center group">
                {/* Gradient fades for smooth edge effect */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#111a22] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#111a22] to-transparent z-10 pointer-events-none"></div>
                {/* Infinite Scrolling Ticker */}
                <div className="flex items-center animate-scroll whitespace-nowrap hover:[animation-play-state:paused] ticker-track">
                  {/* Duplicate set for seamless loop */}
                  {[...tickerData, ...tickerData].map((ticker, index) => (
                    <div key={index} className="flex items-center px-6 gap-3 border-r border-white/5">
                      <span className="text-xs font-semibold text-slate-400">{ticker.label}</span>
                      <span className="text-sm font-mono font-medium text-white">
                        {typeof ticker.value === 'number' ? ticker.value.toFixed(2) : ticker.value}
                      </span>
                      <span className={`flex items-center text-xs font-bold gap-0.5 px-1.5 py-0.5 rounded ${
                        ticker.isPositive 
                          ? 'text-emerald-400 bg-emerald-400/10' 
                          : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {ticker.isPositive ? 'arrow_drop_up' : 'arrow_drop_down'}
                        </span>
                        {ticker.isPositive ? '+' : ''}{typeof ticker.change === 'number' ? ticker.change.toFixed(2) : ticker.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 lg:p-10 space-y-8">
              {/* Hero Section */}
      <motion.div
                initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden relative border border-[#233648] bg-[#1e293b]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#111a22] via-[#111a22]/90 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-start justify-center p-8 lg:p-12 min-h-[320px]">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary mb-4 border border-primary/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    System Online
                  </div>
                  <h1 className="text-white text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 max-w-2xl">
                    Welcome back, Analyst. <br/>
                    <span className="text-slate-400 font-normal">Your models are ready for deployment.</span>
          </h1>
                  <p className="text-slate-300 text-sm lg:text-base font-medium mb-8 font-body max-w-xl">
                    GPU Cluster: <span className="text-green-400">Online (8/8 Active)</span>  |  API Quota: <span className="text-yellow-400">85% Remaining</span>  |  Last Sync: 2 mins ago
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/benchmarks')}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary h-12 px-6 text-white text-sm font-bold tracking-wide hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(19,127,236,0.3)]"
                    >
                      <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
                      View System Health
                    </button>
                    <button
                      onClick={() => navigate('/prediction')}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#233648] h-12 px-6 text-white text-sm font-bold tracking-wide hover:bg-[#334b63] transition-all border border-[#334b63]"
                    >
                      <span className="material-symbols-outlined text-[20px]">history</span>
                      View Logs
                    </button>
        </div>
        </div>
      </motion.div>

              {/* Quick Actions Grid */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white text-xl font-bold tracking-tight">Quick Actions</h2>
                  <button className="text-primary text-sm font-bold hover:underline">Customize</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: New Prediction */}
      <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate('/prediction')}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#233648] bg-[#1e293b] p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-48"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all"></div>
                    <div className="z-10 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary mb-4">
                      <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                    </div>
                    <div className="z-10">
                      <h3 className="text-white text-lg font-bold mb-1">New Prediction</h3>
                      <p className="text-slate-400 text-sm font-body">Initialize a new LSTM or RNN model run on fresh datasets.</p>
                    </div>
      </motion.div>

                  {/* Card 2: Compare Models */}
      <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate('/comparison')}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#233648] bg-[#1e293b] p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-48"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="z-10 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 mb-4">
                      <span className="material-symbols-outlined text-3xl">compare_arrows</span>
    </div>
                    <div className="z-10">
                      <h3 className="text-white text-lg font-bold mb-1">Compare Models</h3>
                      <p className="text-slate-400 text-sm font-body">Side-by-side analysis of LSTM vs RNN accuracy and loss metrics.</p>
      </div>
          </motion.div>

                  {/* Card 3: Market Analysis */}
        <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate('/benchmarks')}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#233648] bg-[#1e293b] p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-48"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="z-10 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 mb-4">
                      <span className="material-symbols-outlined text-3xl">ssid_chart</span>
    </div>
                    <div className="z-10">
                      <h3 className="text-white text-lg font-bold mb-1">Market Analysis</h3>
                      <p className="text-slate-400 text-sm font-body">Visualize general market trends and sentiment analysis.</p>
            </div>
          </motion.div>
                </div>
      </div>

              {/* Recent Activity / Table Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white text-xl font-bold tracking-tight">Recent Model Runs</h2>
                    <button 
                      onClick={() => navigate('/benchmarks')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-bold transition-colors"
                    >
                      View All
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#233648] bg-[#1e293b]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-[#16202a] text-xs uppercase text-slate-300">
                          <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Model ID</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Architecture</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Dataset</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Accuracy</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#233648]">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                Loading recent runs...
                              </td>
                            </tr>
                          ) : popularStocks.length > 0 ? (
                            popularStocks.slice(0, 4).map((stock, index) => {
                              const modelType = index % 2 === 0 ? 'LSTM' : 'RNN'
                              return (
                                <tr 
                                  key={`${stock.symbol}-${index}`} 
                                  onClick={() => {
                                    if (stock.symbol) {
                                      localStorage.setItem('defaultTicker', stock.symbol)
                                      navigate('/prediction')
                                    }
                                  }}
                                  className="hover:bg-[#233648]/50 transition-colors cursor-pointer"
                                >
                                  <td className="whitespace-nowrap px-6 py-4 font-medium text-white">#Run-{4920 - index}</td>
                                  <td className="whitespace-nowrap px-6 py-4">
                                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold border ${
                                      index % 2 === 0 
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    }`}>
                                      {modelType}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-4 text-white">{stock.symbol} ({stock.name || 'Stock'})</td>
                                  <td className="whitespace-nowrap px-6 py-4 text-green-400 font-bold">
                                    {((stock.change_percent || 0) + 90).toFixed(1)}%
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                      <span className="text-white">Completed</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                No recent runs available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Resource Usage Widget */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-white text-xl font-bold tracking-tight">Resource Usage</h2>
                  <div className="rounded-xl border border-[#233648] bg-[#1e293b] p-6 flex flex-col gap-6 h-full">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-bold text-white">
                        <span>GPU Load</span>
                        <span className="text-primary">78%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#111a22]">
                        <div className="h-2 w-[78%] rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-bold text-white">
                        <span>Memory (RAM)</span>
                        <span className="text-purple-400">42%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#111a22]">
                        <div className="h-2 w-[42%] rounded-full bg-purple-500"></div>
                      </div>
                    </div>
                    <div className="mt-auto rounded-lg bg-[#111a22] p-4 border border-[#233648]">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-500 mt-0.5">warning</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">System Status</h4>
                          <p className="text-xs text-slate-400 mt-1">All systems operational. API connected.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    </div>
      </div>
      </div>
  </main>
    </div>
  )
}
