import { motion, AnimatePresence } from 'framer-motion'
import { verificationsApi, usersApi, type UserVerification } from '../api/client'
import { useState, useEffect } from 'react'
import './ProofModal.css'

interface ProofModalProps {
  isOpen: boolean
  onClose: () => void
  verificationId: number
  isAllSongs?: boolean
}

interface VerificationDetail {
  id: number
  username: string
  songTitle: string
  streamCount: number
  proofImage: string
  status: string
  verifiedAt: string
  createdAt: string
}

const ProofModal = ({ isOpen, onClose, verificationId, isAllSongs = false }: ProofModalProps) => {
  const [verification, setVerification] = useState<VerificationDetail | null>(null)
  const [allVerifications, setAllVerifications] = useState<UserVerification[]>([])
  const [username, setUsername] = useState<string>('')
  const [totalStreams, setTotalStreams] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // View state: 'list' (All Songs list) or 'detail' (single verification detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && verificationId) {
      // Reset view mode when modal opens
      setViewMode(isAllSongs ? 'list' : 'detail')
      setSelectedVerificationId(null)

      if (isAllSongs) {
        fetchUserVerifications()
      } else {
        fetchVerification()
      }
    }
  }, [isOpen, verificationId, isAllSongs])

  const fetchVerification = async (id?: number) => {
    try {
      setLoading(true)
      const targetId = id || verificationId
      const data = await verificationsApi.getById(targetId)
      setVerification(data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch verification:', err)
      setError('인증 정보를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVerifications = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getById(verificationId)
      setUsername(data.username)
      setAllVerifications(data.verifications)
      setTotalStreams(data.totalStreams)
      setError('')
    } catch (err) {
      console.error('Failed to fetch user verifications:', err)
      setError('사용자 정보를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSongClick = async (songVerificationId: number) => {
    setSelectedVerificationId(songVerificationId)
    setViewMode('detail')
    await fetchVerification(songVerificationId)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedVerificationId(null)
    setVerification(null)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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
            className="proof-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="proof-modal-header">
              <div className="header-left">
                {isAllSongs && viewMode === 'detail' && (
                  <motion.button
                    className="back-button"
                    onClick={handleBackToList}
                    whileHover={{ scale: 1.02, x: -3 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="back-icon">←</span>
                    <span className="back-text">Back</span>
                    <div className="button-glow"></div>
                  </motion.button>
                )}
                <h2 className="proof-modal-title">
                  <span className="holo-text">스트리밍 인증</span>
                </h2>
              </div>
              <motion.button
                className="modal-close-button"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            <div className="proof-modal-content">
              {loading ? (
                <div className="loading-state">
                  <motion.div
                    className="loading-spinner-large"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⟳
                  </motion.div>
                  <p>로딩 중...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p className="error-message">{error}</p>
                </div>
              ) : isAllSongs && viewMode === 'list' && allVerifications.length > 0 ? (
                <>
                  {/* User Info for All Songs */}
                  <div className="proof-user-info">
                    <div className="info-row">
                      <span className="info-label">사용자</span>
                      <span className="info-value">{username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">총 스트리밍 횟수</span>
                      <span className="info-value highlight">{formatNumber(totalStreams)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">곡 수</span>
                      <span className="info-value">{allVerifications.length}곡</span>
                    </div>
                  </div>

                  {/* All Songs List */}
                  <div className="all-songs-list">
                    <h3 className="section-subtitle">곡별 스트리밍 현황</h3>
                    {allVerifications.map((v, index) => (
                      <motion.div
                        key={v.id}
                        className="song-verification-item glass clickable"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSongClick(v.id)}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="song-verification-header">
                          <div className="song-info">
                            <span className="song-rank">#{index + 1}</span>
                            <span className="song-title">{v.songTitle}</span>
                          </div>
                          <div className="song-stream-count">
                            <span className="count-number">{formatNumber(v.streamCount)}</span>
                            <span className="count-label">streams</span>
                          </div>
                        </div>
                        <div className="song-verification-footer">
                          <span className="verified-date">{formatDate(v.verifiedAt)}</span>
                          <span className="view-detail-hint">상세 보기 →</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : verification ? (
                <>
                  {/* User Info */}
                  <div className="proof-user-info">
                    <div className="info-row">
                      <span className="info-label">사용자</span>
                      <span className="info-value">{verification.username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">곡</span>
                      <span className="info-value">{verification.songTitle}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">스트리밍 횟수</span>
                      <span className="info-value highlight">{formatNumber(verification.streamCount)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">인증 시각</span>
                      <span className="info-value">{formatDate(verification.verifiedAt)}</span>
                    </div>
                  </div>

                  {/* Proof Image */}
                  <div className="proof-image-container">
                    <div className="proof-image-wrapper">
                      <motion.img
                        src={`/image/melon/uploads/${verification.proofImage}`}
                        alt="스트리밍 인증 스크린샷"
                        className="proof-image"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      <div className="verified-stamp">
                        <motion.div
                          className="stamp-content"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                        >
                          ✓ 인증됨
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProofModal
