import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getAccessToken, getStoredUser, setAuth } from '../services/api'
import { fetchMe, login as loginRequest } from '../services/authService'
import type { User } from '../types/user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAgent: boolean
  login: (email: string, password: string) => Promise<void>
  establishSession: (token: string, sessionUser: User) => void
  updateUser: (sessionUser: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const isAuthenticated = Boolean(getAccessToken())

  const establishSession = useCallback((token: string, sessionUser: User) => {
    setAuth(token, sessionUser)
    setUser(sessionUser)
  }, [])

  const updateUser = useCallback((sessionUser: User) => {
    const token = getAccessToken()
    if (token) setAuth(token, sessionUser)
    setUser(sessionUser)
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    fetchMe()
      .then((freshUser) => {
        setAuth(token, freshUser)
        setUser(freshUser)
      })
      .catch(() => {
        clearAuth()
        setUser(null)
      })
  }, [])

  const login = useCallback(async (loginEmail: string, password: string) => {
    const data = await loginRequest(loginEmail, password)
    establishSession(data.access_token, data.user)
    navigate('/', { replace: true })
  }, [navigate, establishSession])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAdmin: user?.role === 'admin',
      isAgent: user?.role === 'agent',
      login,
      establishSession,
      updateUser,
      logout,
    }),
    [user, isAuthenticated, login, establishSession, updateUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
