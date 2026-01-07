import { motion, AnimatePresence } from 'framer-motion'
import { authUtils } from '../utils/auth'
import './Header.css'

interface HeaderProps {
  activeView: 'songs' | 'leaderboard'
  onViewChange: (view: 'songs' | 'leaderboard') => void
  username: string | null
  onLoginClick: () => void
  onLogoutClick: () => void
}

const Header = ({ activeView, onViewChange, username, onLoginClick, onLogoutClick }: HeaderProps) => {
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

          <AnimatePresence mode="wait">
            {username ? (
              <motion.div
                key="logged-in"
                className="auth-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="user-badge">
                  <span className="user-icon">👤</span>
                  <span className="username">{username}</span>
                </div>
                <motion.button
                  className="logout-button"
                  onClick={onLogoutClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  로그아웃
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="logged-out"
                className="login-button"
                onClick={onLoginClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <span className="login-icon">🔐</span>
                <span>로그인</span>
              </motion.button>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  )
}

export default Header
