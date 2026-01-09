import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        result = await register(formData.email, formData.password, formData.fullName)
      }

      if (result.success) {
        toast.success(isLogin ? 'Login successful!' : 'Registration successful!')
        navigate('/')
      } else {
        toast.error(result.error || 'Authentication failed')
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-xl mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">
                {isLogin ? 'login' : 'person_add'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-secondary">
              {isLogin ? 'Login to access StockNeuro Dashboard' : 'Sign up to get started'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-text-secondary text-[20px]">mail</span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary pl-10 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Enter email"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Enter full name (optional)"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-text-secondary text-[20px]">lock</span>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary pl-10 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>{isLogin ? 'Logging in...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">{isLogin ? 'login' : 'person_add'}</span>
                  <span>{isLogin ? 'Login' : 'Register'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary-dark transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-text-secondary hover:text-white transition-colors text-sm flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
