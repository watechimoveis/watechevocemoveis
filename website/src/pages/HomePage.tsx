import { PropertyCard } from '../components/properties/PropertyCard'
import { PropertyFilters } from '../components/search/PropertyFilters'
import type { SearchState } from '../hooks/usePropertySearch'
import { usePageTitle } from '../hooks/usePageTitle'
import { usePropertySearch } from '../hooks/usePropertySearch'

export function HomePage() {
  usePageTitle(null)

  const {
    draft,
    setDraft,
    applied,
    applySearch,
    clearFilters,
    removeFilter,
    properties,
    total,
    pages,
    page,
    goToPage,
    loading,
    error,
    retry,
  } = usePropertySearch()

  const showEmpty = !loading && !error && properties.length === 0

  return (
    <>
      <PropertyFilters
        draft={draft}
        applied={applied}
        onChange={setDraft}
        onSearch={applySearch}
        onClear={clearFilters}
        onRemoveFilter={removeFilter}
        loading={loading}
        total={loading || error ? undefined : total}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div
            className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-800">Nenhum imóvel encontrado</p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveSearch(applied)
                ? 'Tente ampliar a busca ou remover alguns filtros.'
                : 'Em breve novos anúncios com contato direto ao corretor responsável.'}
            </p>
            {hasActiveSearch(applied) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : !error ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-500">
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : null}
      </main>
    </>
  )
}

function hasActiveSearch(applied: SearchState) {
  return Boolean(
    applied.location.trim() ||
      applied.minPrice ||
      applied.maxPrice ||
      applied.minRooms ||
      applied.minSize ||
      applied.sort !== 'recent' ||
      applied.listingType !== 'sale',
  )
}
