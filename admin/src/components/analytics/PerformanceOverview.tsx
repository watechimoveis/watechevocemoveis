import { Link } from 'react-router-dom'
import type { AnalyticsOverview } from '../../types/analytics'

interface PerformanceOverviewProps {
  data: AnalyticsOverview | null
  loading?: boolean
  title?: string
  subtitle?: string
}

export function PerformanceOverview({
  data,
  loading,
  title = 'Desempenho (7 dias)',
  subtitle = 'Visualizações no site e cliques no WhatsApp',
}: PerformanceOverviewProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 xl:p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </section>
    )
  }

  if (!data) return null

  const { totals, daily, top_properties, conversion_rate } = data
  const hasActivity = totals.views_7d > 0 || totals.whatsapp_clicks_7d > 0
  const chartMax = Math.max(...daily.map((d) => Math.max(d.views, d.whatsapp)), 1)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 xl:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-page-title text-lg font-semibold text-slate-900 xl:text-xl">{title}</h2>
          <p className="type-page-lead text-slate-500">{subtitle}</p>
        </div>
        {conversion_rate != null && (
          <p className="type-page-lead mt-2 sm:mt-0">
            Taxa de conversão{' '}
            <span className="font-bold text-emerald-700">{conversion_rate}%</span>
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <KpiCard label="Visualizações" value={totals.views_7d} accent="text-blue-700" bg="bg-blue-50" />
        <KpiCard
          label="Leads WhatsApp"
          value={totals.whatsapp_clicks_7d}
          accent="text-emerald-700"
          bg="bg-emerald-50"
          highlight
        />
        <KpiCard label="Visualizações (30d)" value={totals.views_30d} accent="text-slate-700" bg="bg-slate-50" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="type-section-label mb-3 font-semibold uppercase text-slate-500">Atividade diária</p>
          {!hasActivity ? (
            <EmptyChartHint />
          ) : (
            <>
              <div className="flex h-44 items-end justify-between gap-1.5 sm:gap-2 xl:h-52">
                {daily.map((day) => (
                  <DayColumn
                    key={day.date}
                    label={formatDayLabel(day.date)}
                    views={day.views}
                    whatsapp={day.whatsapp}
                    max={chartMax}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-5 type-meta text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> WhatsApp
                </span>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          <p className="type-section-label mb-3 font-semibold uppercase text-slate-500">
            Ranking de anúncios
          </p>
          {top_properties.length === 0 ? (
            <EmptyChartHint />
          ) : (
            <ul className="space-y-3">
              {top_properties.map((item, index) => {
                const score = item.whatsapp_clicks_7d * 2 + item.views_7d
                const maxScore = Math.max(
                  ...top_properties.map((p) => p.whatsapp_clicks_7d * 2 + p.views_7d),
                  1,
                )
                return (
                  <li key={item.id}>
                    <Link
                      to={`/imoveis?editar=${item.id}`}
                      className="group block rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 group-hover:text-blue-700 xl:text-base">
                            {item.title || 'Sem título'}
                          </p>
                          <p className="type-meta mt-0.5 text-slate-500">
                            {item.views_7d} views · {item.whatsapp_clicks_7d} WhatsApp
                          </p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                              style={{ width: `${(score / maxScore) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <FunnelStrip views={totals.views_7d} whatsapp={totals.whatsapp_clicks_7d} />
    </section>
  )
}

function KpiCard({
  label,
  value,
  accent,
  bg,
  highlight,
}: {
  label: string
  value: number
  accent: string
  bg: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${bg} ${highlight ? 'border-emerald-200' : 'border-slate-200/80'}`}
    >
      <p className={`type-section-label font-medium ${accent}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 xl:text-3xl">{value}</p>
    </div>
  )
}

function DayColumn({
  label,
  views,
  whatsapp,
  max,
}: {
  label: string
  views: number
  whatsapp: number
  max: number
}) {
  const viewH = views > 0 ? Math.max((views / max) * 100, 6) : 0
  const waH = whatsapp > 0 ? Math.max((whatsapp / max) * 100, 6) : 0

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1 xl:h-44">
        <div
          className="w-[38%] rounded-t bg-blue-500/90 transition-all"
          style={{ height: `${viewH}%` }}
          title={`${views} views`}
        />
        <div
          className="w-[38%] rounded-t bg-emerald-500/90 transition-all"
          style={{ height: `${waH}%` }}
          title={`${whatsapp} WhatsApp`}
        />
      </div>
      <span className="type-meta mt-1.5 truncate text-center text-slate-500">{label}</span>
    </div>
  )
}

function FunnelStrip({ views, whatsapp }: { views: number; whatsapp: number }) {
  if (views <= 0 && whatsapp <= 0) return null

  const visitPct = 100
  const leadPct = views > 0 ? Math.max((whatsapp / views) * 100, whatsapp > 0 ? 4 : 0) : 0

  return (
    <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3">
      <p className="type-section-label mb-2 font-semibold uppercase text-slate-500">Funil simplificado</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <FunnelStep label="Visitas ao anúncio" value={views} width={visitPct} color="bg-blue-500" />
        <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
          →
        </span>
        <FunnelStep label="Cliques no WhatsApp" value={whatsapp} width={leadPct} color="bg-emerald-500" />
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  value,
  width,
  color,
}: {
  label: string
  value: number
  width: number
  color: string
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="type-meta text-slate-600">{label}</span>
        <span className="type-meta font-semibold tabular-nums text-slate-800">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(width, 100)}%` }} />
      </div>
    </div>
  )
}

function EmptyChartHint() {
  return (
    <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center">
      <p className="type-page-lead text-slate-500">
        Os gráficos aparecem quando visitantes visualizarem seus anúncios no site.
      </p>
    </div>
  )
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}
