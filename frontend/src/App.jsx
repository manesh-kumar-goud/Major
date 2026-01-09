import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Prediction from './pages/Prediction'
import Comparison from './pages/Comparison'
import Benchmarks from './pages/Benchmarks'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Watchlist from './pages/Watchlist'
import Portfolio from './pages/Portfolio'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* All pages render directly with their own layouts */}
            <Route path="/" element={<Home />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/portfolio" element={<Portfolio />} />
            {/* Fallback route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


