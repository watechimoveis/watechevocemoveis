import { AdminDashboard } from '../components/dashboard/AdminDashboard'
import { AgentDashboard } from '../components/dashboard/AgentDashboard'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <AgentDashboard />
}
