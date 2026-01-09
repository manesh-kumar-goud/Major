import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function About() {
  const features = [
    {
      icon: 'code',
      title: 'Modern Tech Stack',
      description: 'Built with FastAPI, React 18, Vite, and TensorFlow for optimal performance',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'psychology',
      title: 'Deep Learning',
      description: 'LSTM and RNN models trained on real market data for accurate predictions',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'database',
      title: 'Real-time Data',
      description: 'Integrated with RapidAPI for live stock market data and updates',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'analytics',
      title: 'Advanced Analytics',
      description: 'Comprehensive metrics including RMSE, MAE, R² Score, and Accuracy',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: 'compare_arrows',
      title: 'Model Comparison',
      description: 'Side-by-side comparison of LSTM and RNN model performance',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: 'security',
      title: 'Secure & Fast',
      description: 'JWT authentication, async operations, and optimized model inference',
      gradient: 'from-teal-500 to-blue-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-6">
          <span className="material-symbols-outlined text-primary text-5xl">info</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
          About StockNeuro
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Intelligent Stock Market Forecasting Using Deep Learning - A Comparative Analysis of LSTM and RNN Models
        </p>
      </motion.div>

      {/* Main Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          Project Overview
        </h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            StockNeuro is a cutting-edge web application that leverages the power of deep learning to forecast
            stock prices with unprecedented accuracy. The platform compares two advanced neural network architectures:
            <strong className="text-accent-lstm"> Long Short-Term Memory (LSTM)</strong> and{' '}
            <strong className="text-accent-rnn">Recurrent Neural Networks (RNN)</strong>.
          </p>
          <p>
            Built with modern technologies including FastAPI for the backend and React 18 with Vite for the frontend,
            StockNeuro provides real-time stock data integration, interactive visualizations, and comprehensive model
            comparison metrics to help users make informed investment decisions.
          </p>
          <p>
            The application features live market data from RapidAPI, JWT-based authentication, dark/light theme support,
            and optimized model training and inference for fast predictions.
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="group relative bg-surface-dark border border-border-dark rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg mb-4`}>
                <span className="material-symbols-outlined text-white text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">build</span>
          Technology Stack
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Backend</h3>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                FastAPI 0.115+ (Async Python Framework)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                TensorFlow 2.18 / Keras 3.3 (Deep Learning)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Uvicorn (ASGI Server)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Pydantic (Data Validation)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                JWT Authentication
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Frontend</h3>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                React 18.3+ (UI Framework)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Vite 5.4+ (Build Tool)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Tailwind CSS 3.4+ (Styling)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Recharts 2.12+ (Data Visualization)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Framer Motion (Animations)
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center bg-surface-dark border border-border-dark rounded-xl shadow-xl p-8"
      >
        <p className="text-text-secondary mb-4">
          StockNeuro Dashboard v2.0.0
        </p>
        <p className="text-text-secondary text-sm mb-4">
          Built with ❤️ using modern web technologies
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Contact Us
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Home
          </Link>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
