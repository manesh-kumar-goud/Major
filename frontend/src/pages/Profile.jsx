import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || ''
      })
    }
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement profile update API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Profile updated successfully!')
      // In a real app, you would call: await api.put('/auth/profile', formData)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = () => {
    toast.info('Password change feature coming soon!')
    // TODO: Implement password change modal/page
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-text-secondary mb-4">Please login to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all font-medium"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    )
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
              My Profile
            </h1>
            <p className="text-text-secondary">Manage your account information</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>

        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 text-white text-4xl font-bold">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{user.full_name || user.username}</h2>
          <p className="text-text-secondary">{user.email}</p>
          <button className="mt-4 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white text-sm transition-all">
            Change Photo
          </button>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit</span>
            Edit Profile
          </h2>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                disabled
                placeholder="Username cannot be changed"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Your full name"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Update Profile</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-6 py-3 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all font-medium"
              >
                Change Password
              </button>
            </div>
          </form>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Account Actions
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-between px-4 py-3 bg-background-dark hover:bg-border-dark border border-border-dark rounded-lg text-white transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">tune</span>
                Settings
              </span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout()
                  navigate('/login')
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">logout</span>
                Logout
              </span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}





