import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="inline-flex items-center justify-center w-32 h-32 bg-primary/20 rounded-full mb-8">
          <span className="material-symbols-outlined text-primary text-7xl">error</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-dark hover:bg-border-dark border border-border-dark text-white rounded-lg transition-all font-medium"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all font-medium shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">home</span>
            Back to Home
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border-dark">
          <p className="text-text-secondary text-sm mb-4">Popular Pages:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/prediction" className="px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white text-sm transition-all">
              Prediction
            </Link>
            <Link to="/comparison" className="px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white text-sm transition-all">
              Comparison
            </Link>
            <Link to="/benchmarks" className="px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white text-sm transition-all">
              Benchmarks
            </Link>
            <Link to="/about" className="px-4 py-2 bg-surface-dark hover:bg-border-dark border border-border-dark rounded-lg text-white text-sm transition-all">
              About
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}














