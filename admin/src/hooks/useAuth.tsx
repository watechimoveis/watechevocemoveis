import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getAccessToken, getStoredUser } from '../services/api'
import { login as loginRequest } from '../services/authService'
import type { User } from '../types/user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAgent: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const isAuthenticated = Boolean(getAccessToken())

  const login = useCallback(async (loginEmail: string, password: string) => {
    const data = await loginRequest(loginEmail, password)
    setUser(data.user)
    navigate('/', { replace: true })
  }, [navigate])

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
      logout,
    }),
    [user, isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
