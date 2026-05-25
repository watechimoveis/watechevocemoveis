import type { SearchState } from '../../hooks/usePropertySearch'
import type { ListingType, SortOption } from '../../types/property'
import { LISTING_LABELS } from '../../types/property'

interface PropertyFiltersProps {
  draft: SearchState
  onChange: (draft: SearchState) => void
  onSearch: () => void
  loading?: boolean
  total?: number
}

export function PropertyFilters({ draft, onChange, onSearch, loading, total }: PropertyFiltersProps) {
  function setField<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    onChange({ ...draft, [key]: value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch()
  }

  return (
    <section className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Tipo de negócio</p>
              <ListingToggle
                value={draft.listingType}
                onChange={(v) => setField('listingType', v)}
              />
            </div>

            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
              <FilterInput
                label="Preço mín."
                placeholder="R$ 0"
                inputMode="numeric"
                value={draft.minPrice}
                onChange={(v) => setField('minPrice', v)}
              />
              <FilterInput
                label="Preço máx."
                placeholder="Sem limite"
                inputMode="numeric"
                value={draft.maxPrice}
                onChange={(v) => setField('maxPrice', v)}
              />
              <div className="col-span-2 sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Ordenar</label>
                <select
                  value={draft.sort}
                  onChange={(e) => setField('sort', e.target.value as SortOption)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full shrink-0 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 lg:w-auto"
            >
              {loading ? 'Buscando…' : 'Buscar imóveis'}
            </button>
          </div>
        </form>

        {total != null && total >= 0 && (
          <p className="mt-3 text-sm text-slate-500">
            {total === 0
              ? `Nenhum imóvel para ${LISTING_LABELS[draft.listingType].toLowerCase()}`
              : `${total} ${total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'} · ${LISTING_LABELS[draft.listingType]}`}
          </p>
        )}
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

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric' | 'text'
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  )
}
