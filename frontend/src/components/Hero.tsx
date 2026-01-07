import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { statsApi, Stats } from '../api/client'
import './Hero.css'

const Hero = () => {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.get()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M+'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+'
    }
    return num.toString()
  }

  return (
    <section className="hero container">
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          STREAM,
          <br />
          <span className="hero-title-accent">VERIFY,</span>
          <br />
          RANK UP
        </motion.h1>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          엔믹스 음악을 스트리밍하고 인증하여
          <br />
          최고의 NSWER가 되어보세요
        </motion.p>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="stat-card glass">
            <div className="stat-value">
              {stats ? formatNumber(stats.totalStreams) : '...'}
            </div>
            <div className="stat-label">Total Streams</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value">
              {stats ? formatNumber(stats.activeUsers) : '...'}
            </div>
            <div className="stat-label">Active NSWERs</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value">
              {stats ? stats.totalSongs : '...'}
            </div>
            <div className="stat-label">Songs</div>
          </div>
        </motion.div>
      </motion.div>

      <div className="hero-decoration">
        <motion.div
          className="floating-circle circle-1"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="floating-circle circle-2"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="floating-circle circle-3"
          animate={{
            y: [0, -15, 0],
            x: [0, 15, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </section>
  )
}

export default Hero
