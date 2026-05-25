import { PropertyCard } from '../components/properties/PropertyCard'
import { PropertyFilters } from '../components/search/PropertyFilters'
import { usePropertySearch } from '../hooks/usePropertySearch'

export function HomePage() {
  const {
    draft,
    setDraft,
    applySearch,
    properties,
    total,
    pages,
    page,
    goToPage,
    loading,
    error,
  } = usePropertySearch()

  return (
    <>
      <PropertyFilters
        draft={draft}
        onChange={setDraft}
        onSearch={applySearch}
        loading={loading}
        total={loading ? undefined : total}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-800">Nenhum imóvel encontrado</p>
            <p className="mt-2 text-sm text-slate-500">Ajuste os filtros e busque novamente.</p>
          </div>
        ) : (
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
        )}
      </main>
    </>
  )
}
