import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicRoute, AdminOnlyRoute } from './components/layout/AdminLayout'
import { AuthProvider } from './hooks/useAuth'
import { AgentsPage } from './pages/AgentsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PropertiesPage } from './pages/PropertiesPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/imoveis" element={<PropertiesPage />} />
          </Route>
          <Route element={<AdminOnlyRoute />}>
            <Route path="/corretores" element={<AgentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
