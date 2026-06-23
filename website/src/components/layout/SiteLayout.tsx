import { Link, Outlet } from 'react-router-dom'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173'
const SITE_NAME = 'W.A.Techevoceimoveis'

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 tap-highlight-none">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold leading-none text-white">
              WA
            </div>
            <span className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              <span className="sm:hidden">W.A.Tech</span>
              <span className="hidden sm:inline">{SITE_NAME}</span>
            </span>
          </Link>
          <Link
            to="/admin"
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:border-slate-300 hover:bg-slate-50 sm:px-4"
          >
            <span className="sm:hidden">Corretor</span>
            <span className="hidden sm:inline">Login corretor</span>
          </Link>
        </div>
      </header>

      <Outlet />

      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} {SITE_NAME}
          {import.meta.env.DEV && (
            <span className="ml-2">
              · Painel:{' '}
              <a href={ADMIN_URL} className="underline hover:text-slate-600">
                {ADMIN_URL}
              </a>
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}
