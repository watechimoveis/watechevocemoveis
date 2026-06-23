import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { useAuth } from '../../hooks/useAuth'
import { getAgentInitials } from '../../utils/agent'
import { Button } from '../ui/Button'

export function AdminLayout() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="admin-container flex h-14 items-center justify-between xl:h-16">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <Link to="/" className="flex min-w-0 items-center">
              <BrandLogo size="sm" />
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
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 xl:h-10 xl:w-10 xl:text-sm">
                {getAgentInitials(user?.name)}
              </span>
              <div className="hidden min-w-0 text-right md:block">
                <div className="flex items-center justify-end gap-2">
                  <p className="truncate text-sm font-medium text-slate-900 xl:text-base">{user?.name}</p>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-600 xl:text-xs">
                    {isAdmin ? 'Admin' : 'Corretor'}
                  </span>
                </div>
                <p className="mt-0.5 truncate type-meta text-slate-500 lg:max-w-[14rem] xl:max-w-[18rem]">
                  {user?.email}
                </p>
              </div>
            </div>
            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <Button variant="ghost" size="sm" className="shrink-0 px-3" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="admin-container py-5 sm:py-6 pb-bottom-nav md:pb-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden safe-bottom"
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
          <BottomNavLink to="/" current={location.pathname} exact label="Início" icon="home" />
          <BottomNavLink to="/imoveis" current={location.pathname} label={isAdmin ? 'Imóveis' : 'Anúncios'} icon="properties" />
          {isAdmin && (
            <BottomNavLink to="/corretores" current={location.pathname} label="Corretores" icon="agents" />
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
      className={`rounded-lg px-3 py-2 text-sm font-medium transition xl:px-3.5 xl:py-2.5 xl:text-base ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  )
}

function BottomNavLink({
  to,
  label,
  current,
  exact,
  icon,
}: {
  to: string
  label: string
  current: string
  exact?: boolean
  icon: 'home' | 'properties' | 'agents'
}) {
  const isActive = exact ? current === to : to === '/' ? current === '/' : current.startsWith(to)

  return (
    <Link
      to={to}
      className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-medium transition active:scale-95 ${
        isActive ? 'text-blue-700' : 'text-slate-500'
      }`}
    >
      <NavIcon type={icon} active={isActive} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function NavIcon({ type, active }: { type: 'home' | 'properties' | 'agents'; active: boolean }) {
  const className = `h-6 w-6 ${active ? 'text-blue-600' : 'text-slate-400'}`
  if (type === 'home') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        {active ? (
          <path d="M11.47 3.841a1.5 1.5 0 012.06 0l8.692 8.692a1.5 1.5 0 01-.434 2.432l-.382.127V19.5A1.5 1.5 0 0119.94 21H4.06a1.5 1.5 0 01-1.462-1.113L2.5 19.5v-4.408l-.382-.127a1.5 1.5 0 01-.434-2.432L10.376 3.84z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.125 1.125 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875a1.125 1.125 0 011.125-1.125h2.25a1.125 1.125 0 011.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
        )}
      </svg>
    )
  }
  if (type === 'properties') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        {active ? (
          <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        )}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path fillRule="evenodd" d="M8.25 6.375a3.375 3.375 0 117.5 0 3.375 3.375 0 01-7.5 0zM15 6.375a3.375 3.375 0 117.5 0 3.375 3.375 0 01-7.5 0zM4.125 6.375a3.375 3.375 0 117.5 0 3.375 3.375 0 01-7.5 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" clipRule="evenodd" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      )}
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
