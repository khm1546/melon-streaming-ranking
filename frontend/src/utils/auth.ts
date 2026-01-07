// Authentication utilities using localStorage

export interface AuthUser {
  username: string
  pin: string
}

const AUTH_STORAGE_KEY = 'melon_auth_user'

export const authUtils = {
  // Save user credentials to localStorage
  saveAuth: (username: string, pin: string): void => {
    const authData: AuthUser = { username, pin }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
  },

  // Get stored auth data
  getAuth: (): AuthUser | null => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored) as AuthUser
    } catch {
      return null
    }
  },

  // Clear auth data (logout)
  clearAuth: (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    return authUtils.getAuth() !== null
  },

  // Get current username
  getCurrentUsername: (): string | null => {
    const auth = authUtils.getAuth()
    return auth?.username || null
  }
}
