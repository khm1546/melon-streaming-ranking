import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { leaderboardApi, songsApi } from '../api/client'
import type { Song } from '../App'
import './Leaderboard.css'

interface LeaderboardEntry {
  id: number
  rank: number
  username: string
  songTitle: string
  streamCount: number
  verifiedAt: string
  profileImage?: string
}

const Leaderboard = () => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedSongId, setSelectedSongId] = useState<number | undefined>(undefined)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch songs
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songsData = await songsApi.getAll()
        setSongs(songsData)
      } catch (error) {
        console.error('Failed to fetch songs:', error)
      }
    }

    fetchSongs()
  }, [])

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const leaderboardData = await leaderboardApi.get(filter, selectedSongId)
        setData(leaderboardData)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [filter, selectedSongId])

  // Fallback mock data for development
  const mockData: LeaderboardEntry[] = [
    {
      id: 1,
      rank: 1,
      username: 'NSWER_Supreme',
      songTitle: 'Love Me Like This',
      streamCount: 15234,
      verifiedAt: '2024-01-05',
      profileImage: 'https://via.placeholder.com/100/ff006e/ffffff?text=NS'
    },
    {
      id: 2,
      rank: 2,
      username: 'StreamQueen',
      songTitle: 'O.O',
      streamCount: 12456,
      verifiedAt: '2024-01-05',
      profileImage: 'https://via.placeholder.com/100/8338ec/ffffff?text=SQ'
    },
    {
      id: 3,
      rank: 3,
      username: 'NMIXX_Forever',
      songTitle: 'DICE',
      streamCount: 11234,
      verifiedAt: '2024-01-04',
      profileImage: 'https://via.placeholder.com/100/00f5ff/000000?text=NF'
    },
    {
      id: 4,
      rank: 4,
      username: 'MixItUp',
      songTitle: 'TANK',
      streamCount: 9876,
      verifiedAt: '2024-01-04',
    },
    {
      id: 5,
      rank: 5,
      username: 'StreamMaster',
      songTitle: 'Love Me Like This',
      streamCount: 8765,
      verifiedAt: '2024-01-03',
    }
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '👑'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return rank
    }
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-first'
    if (rank === 2) return 'rank-second'
    if (rank === 3) return 'rank-third'
    return ''
  }

  return (
    <section className="leaderboard-section container">
      <motion.div
        className="leaderboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">Leaderboard</h2>

        <div className="filter-controls">
          <div className="song-filter">
            <select
              className="song-select"
              value={selectedSongId || ''}
              onChange={(e) => setSelectedSongId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">All Songs</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-buttons">
            {(['all', 'today', 'week', 'month'] as const).map((filterOption) => (
              <motion.button
                key={filterOption}
                className={`filter-button ${filter === filterOption ? 'active' : ''}`}
                onClick={() => setFilter(filterOption)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filterOption === 'all' ? 'All Time' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="leaderboard-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
            No data available
          </div>
        ) : (
          data.map((entry, index) => (
          <motion.div
            key={entry.id}
            className={`leaderboard-item glass ${getRankClass(entry.rank)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="rank-badge">
              <span className="rank-number">{getRankIcon(entry.rank)}</span>
            </div>

            <div className="entry-info">
              <div className="username">{entry.username}</div>
              <div className="song-name">{entry.songTitle}</div>
            </div>

            <div className="entry-stats">
              <div className="stream-count">
                <span className="count-number">{formatNumber(entry.streamCount)}</span>
                <span className="count-label">streams</span>
              </div>
            </div>

            <div className="verified-badge">
              <span className="verified-icon">✓</span>
            </div>
          </motion.div>
          ))
        )}
      </motion.div>
    </section>
  )
}

export default Leaderboard
