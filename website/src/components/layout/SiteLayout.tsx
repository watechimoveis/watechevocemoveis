import { Link, Outlet } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { BRAND } from '../../lib/brand'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173'

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center">
            <BrandLogo size="md" />
          </Link>
          <Link
            to="/admin"
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Corretor</span>
            <span className="hidden sm:inline">Área do corretor</span>
          </Link>
        </div>
      </header>

      <Outlet />

      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} {BRAND.name}
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
