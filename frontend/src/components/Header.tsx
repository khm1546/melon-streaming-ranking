import { motion } from 'framer-motion'
import './Header.css'

interface HeaderProps {
  activeView: 'songs' | 'leaderboard'
  onViewChange: (view: 'songs' | 'leaderboard') => void
}

const Header = ({ activeView, onViewChange }: HeaderProps) => {
  return (
    <motion.header
      className="header glass"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container header-container">
        <motion.div
          className="logo"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="logo-text">
            <span className="logo-main">NMIXX</span>
            <span className="logo-sub">STREAMING</span>
          </div>
        </motion.div>

        <nav className="nav">
          <motion.button
            className={`nav-button ${activeView === 'songs' ? 'active' : ''}`}
            onClick={() => onViewChange('songs')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">🎵</span>
            <span>Songs</span>
          </motion.button>

          <motion.button
            className={`nav-button ${activeView === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onViewChange('leaderboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">🏆</span>
            <span>Leaderboard</span>
          </motion.button>
        </nav>
      </div>
    </motion.header>
  )
}

export default Header
