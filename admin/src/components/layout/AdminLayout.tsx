import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function AdminLayout() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-[9px] font-bold leading-none text-white">
                WA
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">W.A.Techevoceimoveis</p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Corretor'}</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" current={location.pathname} exact>
                Início
              </NavLink>
              <NavLink to="/imoveis" current={location.pathname}>
                {isAdmin ? 'Imóveis' : 'Meus anúncios'}
              </NavLink>
              {isAdmin && (
                <NavLink to="/corretores" current={location.pathname}>
                  Corretores
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({
  to,
  children,
  current,
  exact,
}: {
  to: string
  children: React.ReactNode
  current: string
  exact?: boolean
}) {
  const isActive = exact ? current === to : to === '/' ? current === '/' : current.startsWith(to)

  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AdminLayout />
}

export function AdminOnlyRoute() {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <AdminLayout />
}

export function PublicRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
