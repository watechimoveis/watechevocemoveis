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
  const activeFilters = buildActiveFilters(applied)
  const hasExtraFilters = activeFilters.length > 1 || applied.sort !== 'recent'

  function setField<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    onChange({ ...draft, [key]: value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch()
  }

  function handleListingChange(value: ListingType) {
    const next = { ...draft, listingType: value }
    onChange(next)
    onSearch(next)
  }

  return (
    <section className="sticky top-14 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-4">
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-default disabled:opacity-80"
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
      </div>
    </section>
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
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
