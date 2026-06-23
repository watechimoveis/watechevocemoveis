import { useEffect, useState } from 'react'
import type { SearchState } from '../../hooks/usePropertySearch'
import type { ListingType, SortOption } from '../../types/property'
import { LISTING_LABELS } from '../../types/property'
import { formatPriceDigits, parsePriceDigits } from '../../utils/priceInput'
import { buildActiveFilters } from '../../utils/searchLabels'

interface PropertyFiltersProps {
  draft: SearchState
  applied: SearchState
  onChange: (draft: SearchState) => void
  onSearch: (draft?: SearchState) => void
  onClear: () => void
  onRemoveFilter: (key: string) => void
  loading?: boolean
  total?: number
}

const ROOM_OPTIONS = [
  { value: '', label: 'Qualquer' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

export function PropertyFilters({
  draft,
  applied,
  onChange,
  onSearch,
  onClear,
  onRemoveFilter,
  loading,
  total,
}: PropertyFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeFilters = buildActiveFilters(applied)
  const hasExtraFilters = activeFilters.length > 1 || applied.sort !== 'recent'
  const extraFilterCount = activeFilters.filter((f) => f.key !== 'tipo').length + (applied.sort !== 'recent' ? 1 : 0)

  function setField<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    onChange({ ...draft, [key]: value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch()
    setDrawerOpen(false)
  }

  function handleListingChange(value: ListingType) {
    const next = { ...draft, listingType: value }
    onChange(next)
    onSearch(next)
  }

  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen])

  const advancedFields = (
    <>
      <PriceInput
        label="Preço mín."
        placeholder="R$ 0"
        digits={draft.minPrice}
        onChange={(v) => setField('minPrice', v)}
      />
      <PriceInput
        label="Preço máx."
        placeholder="Sem limite"
        digits={draft.maxPrice}
        onChange={(v) => setField('maxPrice', v)}
      />
      <SelectField
        label="Quartos"
        value={draft.minRooms}
        onChange={(v) => setField('minRooms', v)}
        options={ROOM_OPTIONS}
      />
      <FilterInput
        label="Área mín."
        placeholder="Ex.: 60"
        inputMode="numeric"
        suffix="m²"
        value={draft.minSize}
        onChange={(v) => setField('minSize', v.replace(/\D/g, ''))}
      />
      <SelectField
        label="Ordenar"
        value={draft.sort}
        onChange={(v) => setField('sort', v as SortOption)}
        options={[
          { value: 'recent', label: 'Mais recentes' },
          { value: 'price_asc', label: 'Menor preço' },
          { value: 'price_desc', label: 'Maior preço' },
        ]}
      />
    </>
  )

  return (
    <section className="sticky top-14 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:top-16">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-5">
        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          {/* Mobile & tablet: barra compacta */}
          <div className="space-y-3 lg:hidden">
            <ListingToggle value={draft.listingType} onChange={handleListingChange} />

            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <label className="sr-only">Bairro ou cidade</label>
                <input
                  type="search"
                  placeholder="Bairro ou cidade…"
                  value={draft.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50"
              >
                Filtros
                {extraFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {extraFilterCount}
                  </span>
                )}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? '…' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Desktop: filtros completos inline */}
          <div className="hidden space-y-4 lg:block">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Tipo de negócio</p>
                <ListingToggle value={draft.listingType} onChange={handleListingChange} />
              </div>

              <div className="flex-1 sm:max-w-md">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Bairro ou cidade
                </label>
                <input
                  type="search"
                  placeholder="Ex.: Centro, Jardins…"
                  value={draft.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
              {advancedFields}
              <button
                type="submit"
                disabled={loading}
                className="col-span-2 h-11 w-full rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:col-span-1 lg:col-span-1"
              >
                {loading ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>

        <FilterChips
          total={total}
          applied={applied}
          activeFilters={activeFilters}
          hasExtraFilters={hasExtraFilters}
          onRemoveFilter={onRemoveFilter}
          onClear={onClear}
        />
      </div>

      {/* Drawer de filtros avançados — mobile/tablet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-drawer-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="filter-drawer-title" className="text-lg font-semibold text-slate-900">
                Filtros avançados
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
                {advancedFields}
              </div>

              <div className="flex gap-3 border-t border-slate-100 px-5 py-4 safe-bottom">
                <button
                  type="button"
                  onClick={() => {
                    onClear()
                    setDrawerOpen(false)
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Buscando…' : 'Aplicar filtros'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

function FilterChips({
  total,
  applied,
  activeFilters,
  hasExtraFilters,
  onRemoveFilter,
  onClear,
}: {
  total?: number
  applied: SearchState
  activeFilters: ReturnType<typeof buildActiveFilters>
  hasExtraFilters: boolean
  onRemoveFilter: (key: string) => void
  onClear: () => void
}) {
  if (total == null && activeFilters.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
      {total != null && total >= 0 && (
        <p className="text-sm text-slate-500">
          {total === 0
            ? `Nenhum imóvel para ${LISTING_LABELS[applied.listingType].toLowerCase()}`
            : `${total} ${total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
        </p>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              disabled={filter.key === 'tipo'}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition active:scale-[0.97] hover:bg-slate-200 disabled:cursor-default disabled:opacity-80"
              title={filter.key === 'tipo' ? undefined : 'Remover filtro'}
            >
              {filter.label}
              {filter.key !== 'tipo' && (
                <span className="text-slate-400" aria-hidden="true">
                  ×
                </span>
              )}
            </button>
          ))}
          {hasExtraFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ListingToggle({
  value,
  onChange,
}: {
  value: ListingType
  onChange: (v: ListingType) => void
}) {
  const options: ListingType[] = ['sale', 'rent']
  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] sm:flex-none sm:py-2 ${
            value === option
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {LISTING_LABELS[option]}
        </button>
      ))}
    </div>
  )
}

function PriceInput({
  label,
  placeholder,
  digits,
  onChange,
}: {
  label: string
  placeholder?: string
  digits: string
  onChange: (digits: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={formatPriceDigits(digits)}
        onChange={(e) => onChange(parsePriceDigits(e.target.value))}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:py-2.5"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:py-2.5"
      >
        {options.map((opt) => (
          <option key={opt.value || 'any'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  suffix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  suffix?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:py-2.5"
        />
        {suffix && value && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
