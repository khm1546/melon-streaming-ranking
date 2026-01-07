import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authUtils } from '../utils/auth'
import { authApi } from '../api/client'
import './LoginModal.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (username: string) => void
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim()) {
      setError('닉네임을 입력해주세요')
      return
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN은 정확히 4자리 숫자여야 합니다')
      return
    }

    setIsLoading(true)

    try {
      // Verify username and PIN with backend
      await authApi.login(username.trim(), pin)

      // Save to localStorage after successful verification
      authUtils.saveAuth(username.trim(), pin)

      // Success
      onLoginSuccess(username.trim())
      setUsername('')
      setPin('')
      onClose()
    } catch (err: any) {
      // Handle error from backend
      const errorMessage = err.response?.data?.error || '로그인 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(value)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Modal */}
          <motion.div
            className="login-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-header">
              <h2 className="login-modal-title">
                <span className="holo-text">로그인</span>
              </h2>
              <motion.button
                className="modal-close-button"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  닉네임
                </label>
                <motion.input
                  id="username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  autoComplete="off"
                  whileFocus={{ scale: 1.02 }}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pin" className="form-label">
                  PIN (4자리)
                </label>
                <motion.input
                  id="pin"
                  type="password"
                  className="form-input pin-input"
                  value={pin}
                  onChange={handlePinInput}
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d{4}"
                  autoComplete="off"
                  whileFocus={{ scale: 1.02 }}
                  disabled={isLoading}
                />
                <div className="pin-dots">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className={`pin-dot ${pin.length > i ? 'filled' : ''}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: pin.length > i ? 1 : 0.7 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="login-submit-button"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⟳
                  </motion.div>
                ) : (
                  '로그인'
                )}
              </motion.button>

              <div className="login-info">
                <p className="info-text">
                  💡 닉네임과 PIN을 잊어버리면 복구가 불가능합니다
                </p>
                <p className="info-text">
                  🔒 개인정보는 수집하지 않으며, 모든 데이터는 기기에만 저장됩니다
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
