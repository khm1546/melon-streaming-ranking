import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import SongGrid from './components/SongGrid'
import Leaderboard from './components/Leaderboard'
import UploadModal from './components/UploadModal'
import LoginModal from './components/LoginModal'
import ProofModal from './components/ProofModal'
import { songsApi } from './api/client'
import { authUtils } from './utils/auth'
import './App.css'

export interface Song {
  id: number
  title: string
  album: string
  releaseDate: string
  coverImage: string
  streamCount: number
}

export interface LeaderboardEntry {
  id: number
  username: string
  songId: number
  songTitle: string
  streamCount: number
  verifiedAt: string
  profileImage?: string
}

function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activeView, setActiveView] = useState<'songs' | 'leaderboard'>('songs')
  const [songs, setSongs] = useState<Song[]>([])

  // Auth state
  const [username, setUsername] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Proof modal state
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofModalData, setProofModalData] = useState<{
    verificationId: number
    username: string
    songTitle: string
    streamCount: number
  } | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const currentUsername = authUtils.getCurrentUsername()
    if (currentUsername) {
      setUsername(currentUsername)
    }
  }, [])

  // Fetch songs from API
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await songsApi.getAll()
        setSongs(data)
      } catch (error) {
        console.error('Failed to fetch songs:', error)
      }
    }

    fetchSongs()
  }, [])

  const handleSongClick = (song: Song) => {
    setSelectedSong(song)
    setShowUploadModal(true)
  }

  const handleCloseModal = () => {
    setShowUploadModal(false)
    setSelectedSong(null)
  }

  const handleUploadSuccess = async () => {
    // Refresh songs data
    try {
      const data = await songsApi.getAll()
      setSongs(data)
    } catch (error) {
      console.error('Failed to refresh songs:', error)
    }
    handleCloseModal()
  }

  const handleLoginClick = () => {
    setShowLoginModal(true)
  }

  const handleLoginSuccess = (loggedInUsername: string) => {
    setUsername(loggedInUsername)
    setShowLoginModal(false)
  }

  const handleLogoutClick = () => {
    authUtils.clearAuth()
    setUsername(null)
  }

  const handleProofClick = (verificationId: number, username: string, songTitle: string, streamCount: number) => {
    setProofModalData({ verificationId, username, songTitle, streamCount })
    setShowProofModal(true)
  }

  const handleCloseProofModal = () => {
    setShowProofModal(false)
    setProofModalData(null)
  }

  return (
    <div className="app">
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        username={username}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
      />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeView === 'songs' ? (
            <motion.div
              key="songs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Hero />
              <SongGrid songs={songs} onSongClick={handleSongClick} />
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard
                currentUsername={username}
                onProofClick={handleProofClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showUploadModal && selectedSong && (
          <UploadModal
            song={selectedSong}
            onClose={handleCloseModal}
            onSuccess={handleUploadSuccess}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {proofModalData && (
        <ProofModal
          isOpen={showProofModal}
          onClose={handleCloseProofModal}
          verificationId={proofModalData.verificationId}
          username={proofModalData.username}
          songTitle={proofModalData.songTitle}
          streamCount={proofModalData.streamCount}
        />
      )}
    </div>
  )
}

export default App
