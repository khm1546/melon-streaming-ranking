import { motion } from 'framer-motion'
import type { Song } from '../App'
import './SongGrid.css'

interface SongGridProps {
  songs: Song[]
  onSongClick: (song: Song) => void
}

const SongGrid = ({ songs, onSongClick }: SongGridProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  return (
    <section className="song-grid-section container">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        Choose Your Song
      </motion.h2>

      <motion.div
        className="song-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {songs.map((song) => (
          <motion.div
            key={song.id}
            className="song-card-wrapper"
            variants={item}
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="song-card glass" onClick={() => onSongClick(song)}>
              <div className="song-cover-container">
                <div className="song-cover-wrapper">
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="song-cover"
                  />
                  <div className="song-overlay">
                    <motion.div
                      className="play-button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span>인증 업로드</span>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-album">{song.album}</p>

                <div className="song-stats">
                  <div className="song-stat">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-text">{formatNumber(song.streamCount)} streams</span>
                  </div>
                </div>
              </div>

              <div className="card-shine"></div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export default SongGrid
