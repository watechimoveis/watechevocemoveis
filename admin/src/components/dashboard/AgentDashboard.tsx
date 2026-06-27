import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AgentWhatsAppEditor } from './AgentWhatsAppEditor'
import { PerformanceOverview } from '../analytics/PerformanceOverview'
import { mediaUrl } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { getAnalyticsOverview } from '../../services/analyticsService'
import { listProperties } from '../../services/propertiesService'
import type { AnalyticsOverview } from '../../types/analytics'
import type { Property } from '../../types/property'
import { PROPERTY_TYPE_LABELS } from '../../types/property'
import { whatsappConversionRate } from '../../utils/analytics'
import { getAgentInitials } from '../../utils/agent'
import { formatPrice } from '../../utils/format'
import { Button } from '../ui/Button'

export function AgentDashboard() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    Promise.all([listProperties(1, 5), getAnalyticsOverview()])
      .then(([data, overview]) => {
        setProperties(data.items)
        setTotal(data.total)
        setAnalytics(overview)
      })
      .finally(() => {
        setLoading(false)
        setAnalyticsLoading(false)
      })
  }, [])

  const totalWhatsApp = analytics?.totals.whatsapp_clicks_7d ?? 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800 xl:h-16 xl:w-16 xl:text-xl">
              {getAgentInitials(user?.name)}
            </div>
            <div>
              <p className="type-page-lead text-emerald-700">Olá, {user?.name?.split(' ')[0]}</p>
              <h1 className="type-page-title font-semibold text-slate-900">Publique seu anúncio</h1>
              <p className="type-page-lead text-slate-500">
                Seu CRECI é vinculado automaticamente; você pode atualizar o WhatsApp quando precisar
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate('/imoveis?novo=1')}
          >
            + Novo anúncio
          </Button>
        </div>

        {user && (
          <dl className="type-page-lead mt-4 grid gap-2 border-t border-emerald-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">CRECI</dt>
              <dd className="font-medium text-slate-800">{user.creci || '—'}</dd>
            </div>
            <AgentWhatsAppEditor user={user} onUpdated={updateUser} />
            <div>
              <dt className="text-slate-500">Meus anúncios</dt>
              <dd className="font-medium text-slate-800">{loading ? '…' : total}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Leads WhatsApp (7d)</dt>
              <dd className="font-medium text-slate-800">{analyticsLoading ? '…' : totalWhatsApp}</dd>
            </div>
          </dl>
        )}
      </div>

      <PerformanceOverview
        data={analytics}
        loading={analyticsLoading}
        title="Seu desempenho"
        subtitle="Como seus anúncios estão performando no site esta semana"
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="type-page-title text-lg font-semibold text-slate-900 xl:text-xl">Anúncios recentes</h2>
          {total > 5 && (
            <Link to="/imoveis" className="text-sm font-medium text-blue-600 hover:underline xl:text-base">
              Ver todos
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-slate-600">Você ainda não publicou nenhum imóvel.</p>
            <Button className="mt-4" onClick={() => navigate('/imoveis?novo=1')}>
              Publicar primeiro anúncio
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {properties.map((property) => (
              <li key={property.id}>
                <Link
                  to="/imoveis"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/imoveis?editar=${property.id}`)
                  }}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50 xl:px-5 xl:py-4"
                >
                  {property.images[0] ? (
                    <img
                      src={mediaUrl(property.images[0].url)}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover xl:h-14 xl:w-14"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 xl:h-14 xl:w-14">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 xl:text-base">
                      {property.title || 'Sem título'}
                    </p>
                    <p className="truncate type-page-lead text-slate-500">
                      {PROPERTY_TYPE_LABELS[property.property_type] || 'Terreno'}
                      {property.location ? ` · ${property.location}` : ''}
                      {' · '}
                      {formatPrice(property.price)}
                    </p>
                    {(() => {
                      const rate = property.stats ? whatsappConversionRate(property.stats) : null
                      return (
                        <p className="truncate type-meta text-slate-400">
                          {property.stats?.views_7d ?? 0} views · {property.stats?.whatsapp_clicks_7d ?? 0} WhatsApp
                          {rate ? ` · ${rate}` : ''}
                        </p>
                      )
                    })()}
                  </div>
                  <span className="type-meta shrink-0 font-medium text-slate-400">
                    {PROPERTY_TYPE_LABELS[property.property_type]?.slice(0, 3) || 'Imv'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
