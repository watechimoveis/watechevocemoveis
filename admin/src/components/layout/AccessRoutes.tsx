import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AdminLayout } from './AdminLayout'

export function SalesAccessRoute() {
  const { isAuthenticated, isAdmin, isAgent } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin && !isAgent) return <Navigate to="/financeiro" replace />
  return <AdminLayout />
}

export function FinancialAccessRoute() {
  const { isAuthenticated, canAccessFinancial } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!canAccessFinancial) return <Navigate to="/" replace />
  return <AdminLayout />
}
