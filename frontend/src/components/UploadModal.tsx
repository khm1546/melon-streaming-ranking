import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { verificationsApi } from '../api/client'
import type { Song } from '../App'
import './UploadModal.css'

interface UploadModalProps {
  song: Song
  onClose: () => void
  onSuccess: () => void
}

const UploadModal = ({ song, onClose, onSuccess }: UploadModalProps) => {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [streamCount, setStreamCount] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('nmixx_username')
    const savedPin = localStorage.getItem('nmixx_pin')
    if (savedUsername) setUsername(savedUsername)
    if (savedPin) setPin(savedPin)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !pin || !streamCount || !uploadedFile) {
      alert('모든 항목을 입력하고 스크린샷을 업로드해주세요')
      return
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      alert('PIN은 정확히 4자리 숫자여야 합니다')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('pin', pin)
      formData.append('songId', song.id.toString())
      formData.append('streamCount', streamCount)
      formData.append('proof', uploadedFile)

      const response = await verificationsApi.create(formData)

      // Save credentials to localStorage on success
      localStorage.setItem('nmixx_username', username)
      localStorage.setItem('nmixx_pin', pin)

      alert(response.message || '업로드 성공! 스트리밍 인증이 제출되었습니다.')
      onSuccess()
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMsg = error.response?.data?.error || '업로드 실패. 다시 시도해주세요.'
      alert(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="modal-content glass"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">스트리밍 인증 업로드</h2>
          <div className="modal-song-info">
            <img src={song.coverImage} alt={song.title} className="modal-song-cover" />
            <div>
              <div className="modal-song-title">{song.title}</div>
              <div className="modal-song-album">{song.album}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              사용자명
            </label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자명을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin" className="form-label">
              PIN (4자리 숫자)
            </label>
            <input
              type="password"
              id="pin"
              className="form-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4자리 PIN을 입력하세요"
              maxLength={4}
              pattern="\d{4}"
              required
            />
            <p className="form-hint">
              {username && localStorage.getItem('nmixx_username') === username
                ? '✓ 저장된 PIN 사용 중'
                : '계정 보호를 위한 4자리 PIN을 설정하세요'}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="streamCount" className="form-label">
              스트리밍 횟수
            </label>
            <input
              type="number"
              id="streamCount"
              className="form-input"
              value={streamCount}
              onChange={(e) => setStreamCount(e.target.value)}
              placeholder="스트리밍 횟수를 입력하세요"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              스트리밍 인증 스크린샷
            </label>
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${uploadedFile ? 'has-file' : ''}`}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="미리보기" className="preview-image" />
                  <div className="preview-overlay">
                    <p>클릭하거나 드래그하여 교체</p>
                  </div>
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">📸</div>
                  <p className="dropzone-text">
                    {isDragActive
                      ? '여기에 스크린샷을 놓으세요'
                      : '스크린샷을 드래그하거나 클릭하여 업로드'}
                  </p>
                  <p className="dropzone-hint">PNG, JPG, GIF 최대 10MB</p>
                </div>
              )}
            </div>
          </div>

          <motion.button
            type="submit"
            className="submit-button"
            disabled={isUploading || !username || !pin || !streamCount || !uploadedFile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isUploading ? (
              <span className="loading-spinner">⏳ 업로드 중...</span>
            ) : (
              <span>인증 제출</span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default UploadModal
