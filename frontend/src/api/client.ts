import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
  rank: number
  username: string
  profileImage?: string
  songTitle: string
  songId: number | null
  streamCount: number
  verifiedAt: string
  createdAt: string
}

export interface UserVerification {
  id: number
  songId: number
  songTitle: string
  streamCount: number
  proofImage: string
  status: string
  verifiedAt: string
  createdAt: string
}

export interface UserProfile {
  id: number
  username: string
  verifications: UserVerification[]
  totalStreams: number
}

export interface Stats {
  totalVerifications: number
  totalStreams: number
  activeUsers: number
  totalSongs: number
}

export const songsApi = {
  getAll: async (): Promise<Song[]> => {
    const response = await apiClient.get('/songs')
    return response.data
  },

  getById: async (id: number): Promise<Song> => {
    const response = await apiClient.get(`/songs/${id}`)
    return response.data
  },
}

export const leaderboardApi = {
  get: async (
    filter: 'all' | 'today' | 'week' | 'month' = 'all',
    songId?: number
  ): Promise<LeaderboardEntry[]> => {
    const params: any = { filter }
    if (songId) {
      params.songId = songId
    }
    const response = await apiClient.get('/leaderboard', { params })
    return response.data
  },
}

export const verificationsApi = {
  create: async (formData: FormData) => {
    const response = await apiClient.post('/verifications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/verifications/${id}`)
    return response.data
  },
}

export const statsApi = {
  get: async (): Promise<Stats> => {
    const response = await apiClient.get('/stats')
    return response.data
  },
}

export const authApi = {
  login: async (username: string, pin: string) => {
    const response = await apiClient.post('/auth/login', { username, pin })
    return response.data
  },
}

export const usersApi = {
  getById: async (userId: number): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/id/${userId}`)
    return response.data
  },
  getByUsername: async (username: string): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${username}`)
    return response.data
  },
}
