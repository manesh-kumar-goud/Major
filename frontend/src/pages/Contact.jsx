import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/contact/submit', formData)
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Message sent successfully! We will get back to you soon.')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to send message. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-6">
            <span className="material-symbols-outlined text-primary text-5xl">mail</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">mail</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Email</h3>
            <p className="text-text-secondary text-sm">support@stockneuro.com</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Response Time</h3>
            <p className="text-text-secondary text-sm">Within 24 hours</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Support</h3>
            <p className="text-text-secondary text-sm">24/7 Available</p>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit</span>
            Send us a Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Your name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="What is this regarding?"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Message *
              </label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-lg bg-background-dark border border-border-dark text-white placeholder-text-secondary px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 text-text-secondary">
            <div>
              <h4 className="text-white font-semibold mb-2">How accurate are the predictions?</h4>
              <p>Our models are trained on historical data and achieve high accuracy rates, but predictions should be used as one tool among many for investment decisions.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">What data sources do you use?</h4>
              <p>We use real-time stock data from RapidAPI Yahoo Finance to ensure accurate and up-to-date information.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Can I export my predictions?</h4>
              <p>Yes! You can export prediction results as CSV files directly from the prediction page.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
