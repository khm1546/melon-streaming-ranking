import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import SongGrid from './components/SongGrid'
import Leaderboard from './components/Leaderboard'
import UploadModal from './components/UploadModal'
import { songsApi } from './api/client'
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

  return (
    <div className="app">
      <Header activeView={activeView} onViewChange={setActiveView} />

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
              <Leaderboard />
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
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
