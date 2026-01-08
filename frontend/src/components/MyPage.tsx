import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usersApi, type UserVerification } from '../api/client'
import type { Song } from '../App'
import './MyPage.css'

interface MyPageProps {
  username: string
  songs: Song[]
  onEditClick: (song: Song, verification: UserVerification) => void
}

const MyPage = ({ username, songs, onEditClick }: MyPageProps) => {
  const [verifications, setVerifications] = useState<UserVerification[]>([])
  const [totalStreams, setTotalStreams] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [username])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getByUsername(username)
      setVerifications(data.verifications)
      setTotalStreams(data.totalStreams)
      setError('')
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
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

  const getSongById = (songId: number): Song | undefined => {
    return songs.find(s => s.id === songId)
  }

  return (
    <section className="mypage-section container">
      <motion.div
        className="mypage-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h2 className="section-title">
            <span className="holo-text">My Page</span>
          </h2>
          <p className="username-display">{username}</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="stat-card glass">
          <div className="stat-icon">🎵</div>
          <div className="stat-content">
            <div className="stat-value">{verifications.length}</div>
            <div className="stat-label">곡 등록</div>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(totalStreams)}</div>
            <div className="stat-label">총 스트리밍</div>
          </div>
        </div>
      </motion.div>

      {/* Verifications List */}
      <motion.div
        className="mypage-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h3 className="subsection-title">등록한 곡</h3>

        {loading ? (
          <div className="loading-state">
            <motion.div
              className="loading-spinner"
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
        ) : verifications.length === 0 ? (
          <div className="empty-state glass">
            <div className="empty-icon">📝</div>
            <h3>아직 등록한 곡이 없습니다</h3>
            <p>Songs 탭에서 곡을 선택하여 스트리밍 인증을 등록해보세요!</p>
          </div>
        ) : (
          <div className="verifications-grid">
            {verifications.map((verification, index) => {
              const song = getSongById(verification.songId)
              return (
                <motion.div
                  key={verification.id}
                  className="verification-card glass"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="verification-header">
                    <div className="song-info-wrapper">
                      <h4 className="song-title">{verification.songTitle}</h4>
                      <p className="verified-date">{formatDate(verification.verifiedAt)}</p>
                    </div>
                  </div>

                  <div className="verification-body">
                    <div className="stream-info">
                      <div className="stream-count-large">
                        <span className="count">{formatNumber(verification.streamCount)}</span>
                        <span className="label">streams</span>
                      </div>
                    </div>

                    {verification.proofImage && (
                      <div className="proof-thumbnail">
                        <img
                          src={`/image/melon/uploads/${verification.proofImage}`}
                          alt="인증 스크린샷"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="verification-footer">
                    {song && (
                      <motion.button
                        className="edit-button"
                        onClick={() => onEditClick(song, verification)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="edit-icon">✏️</span>
                        <span>수정하기</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </section>
  )
}

export default MyPage
