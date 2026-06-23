import heroBg from '../../assets/sysestate.png'
import { HomeHeader } from './HomeHeader'
import { HeroSearch } from './HeroSearch'
import type { SearchState } from '../../hooks/usePropertySearch'

interface HomeHeroProps {
  draft: SearchState
  onChange: (draft: SearchState) => void
  onSearch: (draft?: SearchState) => void
  loading?: boolean
  total?: number
}

const TRUST_ITEMS = [
  { icon: ShieldIcon, label: 'Negociação segura' },
  { icon: PinIcon, label: 'Localizações estratégicas' },
  { icon: DocIcon, label: 'Documentação verificada' },
]

export function HomeHero({ draft, onChange, onSearch, loading, total }: HomeHeroProps) {
  const countLabel = total != null && total > 0 ? `${total}+` : '—'

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-slate-950">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-950/70 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(251,191,36,0.12),transparent_55%)]" />

      <HomeHeader />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Encontre o terreno ideal para o{' '}
              <span className="text-amber-400">seu projeto.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
              Opções de terrenos e imóveis em localização privilegiada para investir ou construir — com
              contato direto ao corretor responsável.
            </p>

            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-white/85">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/20">
                    <Icon />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <HeroSearch draft={draft} onChange={onChange} onSearch={onSearch} loading={loading} />
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto scroll-snap-x pb-2 lg:hidden">
          <MobileStat value={countLabel} label="Anúncios" />
          <MobileStat value="100%" label="Corretor direto" />
          <MobileStat value="WhatsApp" label="Contato rápido" />
        </div>

        <div className="mt-4 hidden rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-4 backdrop-blur-md lg:mt-auto lg:flex lg:items-center lg:justify-between">
          <StatItem icon={MapIcon} value={countLabel} label="Anúncios disponíveis" />
          <StatItem icon={PinIcon} value="100%" label="Contato direto corretor" />
          <StatItem icon={UsersIcon} value="WhatsApp" label="Atendimento rápido" />
          <StatItem icon={ShieldIcon} value="SysEstate" label="Gestão integrada" />
        </div>
      </div>

      <aside className="absolute bottom-32 right-4 hidden max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur-md xl:block">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <TreeIcon />
        </div>
        <p className="text-sm font-semibold text-white">Invista com segurança</p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">
          Anúncios com corretor responsável, CRECI e contato verificado.
        </p>
      </aside>
    </section>
  )
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: () => React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
        <Icon />
      </span>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-white/55">{label}</p>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a.75.75 0 00-1.414-1.414L9 10.586 7.707 9.293a.75.75 0 00-1.414 1.414l2 2a.75.75 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M1 4.631A01.963 01.963 0 011.902 4h14.196c.541 0 .962.437.902.978l-1.5 13.5A.75.75 0 0114.754 19H5.246a.75.75 0 01-.746-.872L5.5 15H3.75a.75.75 0 01-.75-.75V4.631zM5.246 17.5h9.508l1.35-12.15H3.896L5.246 17.5z" clipRule="evenodd" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0 1.224 1.224 0 01-.569 1.175 4.002 4.002 0 01-7.77 0zM16.5 12.75a4.5 4.5 0 10-1.5 8.602" />
    </svg>
  )
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M10 2L6 8h2v2H5l5 8 5-8h-3V8h2L10 2z" />
    </svg>
  )
}

function MobileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="scroll-snap-item min-w-[8rem] shrink-0 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <p className="text-base font-bold text-amber-400">{value}</p>
      <p className="text-[11px] text-white/55">{label}</p>
    </div>
  )
}
