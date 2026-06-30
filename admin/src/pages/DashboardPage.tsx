import { AdminDashboard } from '../components/dashboard/AdminDashboard'
import { AgentDashboard } from '../components/dashboard/AgentDashboard'
import { FinancialDashboard } from '../components/dashboard/FinancialDashboard'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function DashboardPage() {
  const { isAdmin, isAgent, isFinancial } = useAuth()

  if (isFinancial) return <Navigate to="/financeiro" replace />
  if (isAdmin) return <AdminDashboard />
  if (isAgent) return <AgentDashboard />
  return <FinancialDashboard />
}
