import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function AdminLayout() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <Link to="/" className="flex min-w-0 items-center gap-3 tap-highlight-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[9px] font-bold leading-none text-white">
                WA
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  <span className="md:hidden">W.A.Tech</span>
                  <span className="hidden md:inline">W.A.Techevoceimoveis</span>
                </p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Corretor'}</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile & tablet */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden safe-bottom"
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
          <BottomTab to="/" current={location.pathname} exact icon="home" label="Início" />
          <BottomTab to="/imoveis" current={location.pathname} icon="building" label={isAdmin ? 'Imóveis' : 'Anúncios'} />
          {isAdmin && (
            <BottomTab to="/corretores" current={location.pathname} icon="users" label="Corretores" />
          )}
        </div>
      </nav>
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

function BottomTab({
  to,
  children,
  current,
  exact,
  icon,
  label,
}: {
  to: string
  children?: React.ReactNode
  current: string
  exact?: boolean
  icon: 'home' | 'building' | 'users'
  label: string
}) {
  const isActive = exact ? current === to : to === '/' ? current === '/' : current.startsWith(to)

  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium transition active:scale-95 tap-highlight-none ${
        isActive ? 'text-blue-600' : 'text-slate-500'
      }`}
    >
      <TabIcon name={icon} active={isActive} />
      <span>{children ?? label}</span>
    </Link>
  )
}

function TabIcon({ name, active }: { name: 'home' | 'building' | 'users'; active: boolean }) {
  const className = `h-6 w-6 ${active ? 'text-blue-600' : 'text-slate-400'}`

  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  }

  if (name === 'building') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
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
