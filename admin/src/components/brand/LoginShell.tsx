import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5174'

interface LoginShellProps {
  title: string
  subtitle: string
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export function LoginShell({
  title,
  subtitle,
  backHref = SITE_URL,
  backLabel = 'Voltar ao início',
  children,
}: LoginShellProps) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-white/25 hover:bg-black/40 hover:text-white active:scale-[0.98]"
        >
          <ArrowLeftIcon />
          {backLabel}
        </a>
        <a href={backHref} className="hidden sm:block" aria-label="SysEstate — início">
          <BrandLogo size="md" variant="light" />
        </a>
      </header>

      <div className="flex flex-1 items-center px-4 pb-10 pt-2 sm:px-6 lg:justify-end lg:pr-[8%] xl:pr-[12%]">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 sm:hidden">
              <BrandLogo size="md" variant="light" />
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">{subtitle}</p>
          </div>

          {children}

          <p className="mt-6 text-center text-xs text-white/50">
            Procurando um terreno?{' '}
            <a href={backHref} className="font-medium text-amber-400/90 hover:text-amber-300">
              Ver anúncios no site
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M11.78 5.22a.75.75 0 010 1.06L8.062 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}
