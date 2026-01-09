import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const routeNames = {
  '/': 'Dashboard',
  '/prediction': 'Prediction',
  '/comparison': 'Model Comparison',
  '/benchmarks': 'Benchmarks',
  '/about': 'About',
  '/contact': 'Contact',
  '/login': 'Login',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/watchlist': 'Watchlist'
}

export default function Breadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)
  
  const breadcrumbs = paths.map((path, index) => {
    const pathTo = '/' + paths.slice(0, index + 1).join('/')
    const name = routeNames[pathTo] || path.charAt(0).toUpperCase() + path.slice(1)
    return {
      path: pathTo,
      name: name,
      isLast: index === paths.length - 1
    }
  })

  // Always include home
  if (location.pathname !== '/') {
    breadcrumbs.unshift({ path: '/', name: 'Dashboard', isLast: false })
  }

  if (breadcrumbs.length <= 1) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm text-text-secondary px-4 py-2 bg-surface-dark/50 border-b border-border-dark"
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && (
            <span className="material-symbols-outlined text-[14px] text-text-secondary">chevron_right</span>
          )}
          {crumb.isLast ? (
            <span className="text-white font-medium">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-white transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </motion.div>
  )
}





