import { PropertyCard } from '../components/properties/PropertyCard'
import { HomeHero } from '../components/home/HomeHero'
import { BRAND } from '../lib/brand'
import { usePageTitle } from '../hooks/usePageTitle'
import { usePropertySearch } from '../hooks/usePropertySearch'
import { buildActiveFilters } from '../utils/searchLabels'
import { hasActiveSearchFilters, searchResultsEmptyHint, searchResultsTitle } from '../utils/searchCopy'

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
  const activeFilters = buildActiveFilters(applied)

  return (
    <div className="min-h-screen bg-slate-50">
      <HomeHero
        applied={applied}
        draft={draft}
        onChange={setDraft}
        onSearch={applySearch}
        loading={loading}
        total={loading || error ? undefined : total}
      />

      <section id="imoveis" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{searchResultsTitle(applied)}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? 'Carregando anúncios…'
                : total === 0
                  ? searchResultsEmptyHint(applied)
                  : `${total} ${total === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}`}
            </p>
          </div>
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => onRemoveFilter(filter)}
                disabled={filter.key === 'tipo'}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 disabled:opacity-80"
              >
                {filter.label}
                {filter.key !== 'tipo' && <span className="text-slate-400">×</span>}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-800">Nenhum anúncio encontrado</p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveSearchFilters(applied)
                ? 'Tente ampliar a busca ou ajustar os filtros acima.'
                : 'Em breve novos terrenos e imóveis com contato direto ao corretor.'}
            </p>
          </div>
        ) : !error ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
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
      </section>

      <section id="sobre" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900">Sobre o {BRAND.name}</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            {BRAND.tagline} Plataforma focada em terrenos e imóveis, com gestão integrada para
            corretores e contato direto via WhatsApp para quem busca o imóvel ideal.
          </p>
        </div>
      </section>

      <section id="contato" className="border-t border-slate-200 bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {BRAND.name} · Terrenos, imóveis e aluguéis
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Corretor?{' '}
            <a href="/admin" className="font-medium text-amber-400 hover:text-amber-300">
              Acesse o painel
            </a>
          </p>
        </div>
      </section>
    </div>
  )

  function onRemoveFilter(filter: { key: string }) {
    removeFilter(filter.key)
  }
}
