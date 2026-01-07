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

interface LeaderboardProps {
  currentUsername: string | null
  onProofClick: (verificationId: number, username: string, songTitle: string, streamCount: number) => void
}

const Leaderboard = ({ currentUsername, onProofClick }: LeaderboardProps) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedSongId, setSelectedSongId] = useState<number | undefined>(undefined)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const DISPLAY_LIMIT = 100

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

  // Get entries to display
  const getDisplayEntries = () => {
    if (!searchQuery) {
      // No search - show top 100
      return data.slice(0, DISPLAY_LIMIT)
    }

    // Search mode - find matching entries
    const matchingIndices = data
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.username.toLowerCase().includes(searchQuery.toLowerCase()))

    if (matchingIndices.length === 0) {
      return []
    }

    // Get the first match
    const firstMatchIndex = matchingIndices[0].index

    // Show 100 entries starting from the match (match at top + 99 below)
    const startIndex = firstMatchIndex
    const endIndex = Math.min(data.length, startIndex + DISPLAY_LIMIT)

    return data.slice(startIndex, endIndex)
  }

  const topEntries = getDisplayEntries()
  const searchResultCount = searchQuery
    ? data.filter(entry => entry.username.toLowerCase().includes(searchQuery.toLowerCase())).length
    : 0

  // Find current user's entry only when a specific song is selected
  const currentUserEntry = currentUsername && selectedSongId
    ? data.find(entry => entry.username === currentUsername)
    : null

  const showUserEntrySeparately = currentUserEntry && currentUserEntry.rank > DISPLAY_LIMIT

  return (
    <section className="leaderboard-section container">
      <motion.div
        className="leaderboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h2 className="section-title">Leaderboard</h2>
          {!searchQuery && data.length > DISPLAY_LIMIT && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Showing Top {DISPLAY_LIMIT} of {data.length} entries
            </p>
          )}
          {searchQuery && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {searchResultCount > 0
                ? `Found ${searchResultCount} result${searchResultCount !== 1 ? 's' : ''} for "${searchQuery}" (showing nearby 100 entries)`
                : `No results found for "${searchQuery}"`
              }
            </p>
          )}
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        className="search-bar-container"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: currentUserEntry ? 0.4 : 0.2 }}
      >
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="닉네임 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <motion.button
              className="search-clear-button"
              onClick={() => setSearchQuery('')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Current User Rank Card */}
      {currentUserEntry && (
        <motion.div
          className="current-user-rank-card glass"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="rank-card-label">Your Rank</div>
          <div className="rank-card-content">
            <div className="rank-card-position">
              <span className="rank-card-number">#{currentUserEntry.rank}</span>
              <span className="rank-card-username">{currentUserEntry.username}</span>
            </div>
            <div className="rank-card-details">
              <div className="rank-card-song">{currentUserEntry.songTitle}</div>
              <div className="rank-card-streams">
                <span className="streams-number">{formatNumber(currentUserEntry.streamCount)}</span>
                <span className="streams-label">streams</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="leaderboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: currentUserEntry ? 0.4 : 0 }}
      >
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
          <>
            {topEntries.map((entry, index) => {
              const isCurrentUser = currentUsername && entry.username === currentUsername
              const isSearchMatch = searchQuery && entry.username.toLowerCase().includes(searchQuery.toLowerCase())
              return (
              <motion.div
                key={entry.id}
                className={`leaderboard-item glass ${getRankClass(entry.rank)} ${isCurrentUser ? 'current-user' : ''} ${isSearchMatch ? 'search-match' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onProofClick(entry.id, entry.username, entry.songTitle, entry.streamCount)}
                style={{ cursor: 'pointer' }}
              >
                <div className="rank-badge">
                  <span className="rank-number">{getRankIcon(entry.rank)}</span>
                </div>

                <div className="entry-info">
                  <div className="username">
                    {entry.username}
                    {isCurrentUser && <span className="you-badge">YOU</span>}
                  </div>
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
              )
            })}
          </>
        )}
      </motion.div>
    </section>
  )
}

export default Leaderboard
