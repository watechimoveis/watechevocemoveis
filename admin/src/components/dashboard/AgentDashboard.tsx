import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mediaUrl } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { listProperties } from '../../services/propertiesService'
import type { Property } from '../../types/property'
import { LISTING_LABELS, PROPERTY_TYPE_LABELS } from '../../types/property'
import { whatsappConversionRate } from '../../utils/analytics'
import { formatWhatsAppPhone, getAgentInitials } from '../../utils/agent'
import { formatPrice } from '../../utils/format'
import { Button } from '../ui/Button'

export function AgentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [totalWhatsApp, setTotalWhatsApp] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listProperties(1, 5)
      .then((data) => {
        setProperties(data.items)
        setTotal(data.total)
        setTotalWhatsApp(data.items.reduce((sum, p) => sum + (p.stats?.whatsapp_clicks_7d ?? 0), 0))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800">
              {getAgentInitials(user?.name)}
            </div>
            <div>
              <p className="type-page-lead text-emerald-700">Olá, {user?.name?.split(' ')[0]}</p>
              <h1 className="type-page-title font-semibold text-slate-900">Publique seu anúncio</h1>
              <p className="type-page-lead text-slate-500">
                Seus dados (CRECI e WhatsApp) são vinculados automaticamente
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
            <div>
              <dt className="text-slate-500">WhatsApp</dt>
              <dd className="font-medium text-slate-800">{formatWhatsAppPhone(user.whatsapp)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Meus anúncios</dt>
              <dd className="font-medium text-slate-800">{loading ? '…' : total}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Leads WhatsApp (7d)</dt>
              <dd className="font-medium text-slate-800">{loading ? '…' : totalWhatsApp}</dd>
            </div>
          </dl>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="type-page-title text-lg font-semibold text-slate-900 xl:text-xl">Anúncios recentes</h2>
          {total > 5 && (
            <Link to="/imoveis" className="text-sm font-medium text-blue-600 hover:underline">
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
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50"
                >
                  {property.images[0] ? (
                    <img src={mediaUrl(property.images[0].url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {property.title || 'Sem título'}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {PROPERTY_TYPE_LABELS[property.property_type] || 'Imóvel'}
                      {' · '}
                      {property.listing_type === 'rent' ? LISTING_LABELS.rent : LISTING_LABELS.sale}
                      {property.location ? ` · ${property.location}` : ''}
                      {' · '}
                      {formatPrice(property.price)}
                    </p>
                    {(() => {
                      const rate = property.stats ? whatsappConversionRate(property.stats) : null
                      return (
                        <p className="truncate text-xs text-slate-400">
                          {property.stats?.views_7d ?? 0} views · {property.stats?.whatsapp_clicks_7d ?? 0} WhatsApp
                          {rate ? ` · ${rate}` : ''}
                        </p>
                      )
                    })()}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
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
