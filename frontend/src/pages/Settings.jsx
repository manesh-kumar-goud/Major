import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    defaultModel: 'LSTM',
    defaultPeriod: '1y',
    defaultPredictionDays: 30,
    autoRefresh: false,
    refreshInterval: 300,
    emailNotifications: false,
    priceAlerts: false
  })

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings))
      toast.success('Settings saved successfully!')
    } catch (e) {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-text-secondary">Manage your preferences and account settings</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>

        {/* User Info */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Account Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Username</label>
                <div className="text-white font-medium mt-1">{user.username}</div>
              </div>
              {user.email && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Email</label>
                  <div className="text-white font-medium mt-1">{user.email}</div>
                </div>
              )}
              {user.full_name && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Full Name</label>
                  <div className="text-white font-medium mt-1">{user.full_name}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">palette</span>
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Theme</label>
                <p className="text-text-secondary text-sm">Choose light or dark mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all"
              >
                <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        </motion.div>

        {/* Prediction Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Prediction Defaults
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Default Model
              </label>
              <select
                value={settings.defaultModel}
                onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="LSTM">LSTM</option>
                <option value="RNN">RNN</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Default Time Period
              </label>
              <select
                value={settings.defaultPeriod}
                onChange={(e) => setSettings({ ...settings, defaultPeriod: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Default Prediction Days
              </label>
              <input
                type="number"
                min="7"
                max="90"
                value={settings.defaultPredictionDays}
                onChange={(e) => setSettings({ ...settings, defaultPredictionDays: parseInt(e.target.value) || 30 })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Data & Refresh Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sync</span>
            Data & Refresh
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Auto Refresh</label>
                <p className="text-text-secondary text-sm">Automatically refresh stock data</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoRefresh: !settings.autoRefresh })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.autoRefresh ? 'bg-primary' : 'bg-border-dark'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.autoRefresh ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {settings.autoRefresh && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                  Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  step="60"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 300 })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Email Notifications</label>
                <p className="text-text-secondary text-sm">Receive email updates</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-primary' : 'bg-border-dark'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Price Alerts</label>
                <p className="text-text-secondary text-sm">Get notified of price changes</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, priceAlerts: !settings.priceAlerts })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.priceAlerts ? 'bg-primary' : 'bg-border-dark'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.priceAlerts ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-end gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}














