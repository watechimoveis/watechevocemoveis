import { useEffect, useState } from 'react'
import type { SearchState } from '../../hooks/usePropertySearch'
import type { ListingType, PropertyCategory } from '../../types/property'
import { formatPriceDigits, parsePriceDigits } from '../../utils/priceInput'

export type SearchTab = 'terrenos' | 'imoveis' | 'alugueis'

interface HeroSearchProps {
  draft: SearchState
  onChange: (draft: SearchState) => void
  onSearch: (draft?: SearchState) => void
  loading?: boolean
}

const TABS: { id: SearchTab; label: string; listingType: ListingType; category: PropertyCategory | '' }[] = [
  { id: 'terrenos', label: 'Terrenos', listingType: 'sale', category: 'land' },
  { id: 'imoveis', label: 'Imóveis', listingType: 'sale', category: 'residential' },
  { id: 'alugueis', label: 'Aluguéis', listingType: 'rent', category: '' },
]

export function HeroSearch({ draft, onChange, onSearch, loading }: HeroSearchProps) {
  const [tab, setTab] = useState<SearchTab>(() => {
    if (draft.listingType === 'rent') return 'alugueis'
    if (draft.category === 'residential') return 'imoveis'
    return 'terrenos'
  })
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (draft.listingType === 'rent') {
      setTab('alugueis')
    } else if (draft.category === 'residential') {
      setTab('imoveis')
    } else {
      setTab('terrenos')
    }
  }, [draft.listingType, draft.category])

  function setField<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    onChange({ ...draft, [key]: value })
  }

  function selectTab(next: SearchTab) {
    setTab(next)
    const tabConfig = TABS.find((t) => t.id === next)!
    const nextDraft: SearchState = {
      ...draft,
      listingType: tabConfig.listingType,
      category: tabConfig.category,
      minRooms: next === 'terrenos' ? '' : draft.minRooms,
    }
    onChange(nextDraft)
    onSearch(nextDraft)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch()
    document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })
  }

  const ctaLabel =
    tab === 'alugueis' ? 'Buscar aluguéis' : tab === 'imoveis' ? 'Buscar imóveis' : 'Buscar terrenos'

  return (
    <div
      id="buscar"
      className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-md sm:p-6"
    >
      <div className="mb-5 flex gap-1 border-b border-white/10 pb-0">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={`relative px-3 pb-3 text-sm font-semibold transition sm:px-4 ${
              tab === item.id ? 'text-amber-400' : 'text-white/55 hover:text-white/80'
            }`}
          >
            {item.label}
            {tab === item.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Localização">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder="Cidade, bairro ou região"
              value={draft.location}
              onChange={(e) => setField('location', e.target.value)}
              className={inputClass + ' pl-10'}
            />
          </div>
        </Field>

        <Field label="Área mínima (m²)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ex.: 300"
            value={draft.minSize}
            onChange={(e) => setField('minSize', e.target.value.replace(/\D/g, ''))}
            className={inputClass}
          />
        </Field>

        {advancedOpen && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço mín.">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0"
                  value={formatPriceDigits(draft.minPrice)}
                  onChange={(e) => setField('minPrice', parsePriceDigits(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Preço máx.">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Sem limite"
                  value={formatPriceDigits(draft.maxPrice)}
                  onChange={(e) => setField('maxPrice', parsePriceDigits(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            {tab === 'imoveis' && (
              <Field label="Quartos (mín.)">
                <select
                  value={draft.minRooms}
                  onChange={(e) => setField('minRooms', e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="bg-slate-900">Qualquer</option>
                  {['1', '2', '3', '4'].map((n) => (
                    <option key={n} value={n} className="bg-slate-900">{n}+</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Buscando…' : ctaLabel}
          <ArrowIcon />
        </button>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 text-xs font-medium text-white/50 transition hover:text-amber-400/90"
        >
          <GearIcon />
          {advancedOpen ? 'Ocultar busca avançada' : 'Busca avançada'}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">{label}</label>
      {children}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 ${className ?? ''}`} fill="currentColor">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
      <path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.928 1.115l1.598-.54a1 1 0 011.186.447l.68 1.178a1 1 0 01-.12 1.205l-1.27 1.27a7.02 7.02 0 010 2.828l1.27 1.27a1 1 0 01.12 1.205l-.68 1.178a1 1 0 01-1.186.447l-1.598-.54a6.993 6.993 0 01-1.928 1.115l-.331 1.652a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.928-1.115l-1.598.54a1 1 0 01-1.186-.447l-.68-1.178a1 1 0 01.12-1.205l1.27-1.27a7.02 7.02 0 010-2.828l-1.27-1.27a1 1 0 01-.12-1.205l.68-1.178a1 1 0 011.186-.447l1.598.54A6.993 6.993 0 018.008 3.456l.331-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  )
}
