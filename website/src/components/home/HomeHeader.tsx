import { Link } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { useState } from 'react'

const NAV = [
  { label: 'Terrenos', href: '#buscar' },
  { label: 'Imóveis', href: '#imoveis' },
  { label: 'Aluguéis', href: '#buscar' },
  { label: 'Sobre nós', href: '#sobre' },
  { label: 'Contato', href: '#contato' },
]

export function HomeHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BuildingIcon />
          <BrandLogo size="md" variant="light" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/85 transition hover:text-amber-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:text-amber-400"
          >
            <UserIcon />
            Entrar
          </Link>
          <Link
            to="/admin"
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            Corretor
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/admin"
              className="mt-2 rounded-lg bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-slate-950"
              onClick={() => setOpen(false)}
            >
              Área do corretor
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function BuildingIcon() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M4 21V9l8-4 8 4v12h-6v-7H10v7H4z" />
      </svg>
    </span>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.533-.953.41-1.412A6.972 6.972 0 0010 11.75a6.972 6.972 0 00-6.535 2.743z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
