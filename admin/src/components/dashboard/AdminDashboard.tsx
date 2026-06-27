import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PerformanceOverview } from '../analytics/PerformanceOverview'
import { getAnalyticsOverview } from '../../services/analyticsService'
import { listAgents } from '../../services/agentsService'
import { listProperties } from '../../services/propertiesService'
import type { AnalyticsOverview } from '../../types/analytics'
import type { Property } from '../../types/property'
import { ActionCard } from '../ui/ActionCard'

export function AdminDashboard() {
  const [totalProperties, setTotalProperties] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [terrenoCount, setTerrenoCount] = useState(0)
  const [loteCount, setLoteCount] = useState(0)
  const [totalViews7d, setTotalViews7d] = useState(0)
  const [totalWhatsApp7d, setTotalWhatsApp7d] = useState(0)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [properties, agents, overview] = await Promise.all([
          listProperties(1, 100),
          listAgents(),
          getAnalyticsOverview(),
        ])
        setTotalProperties(properties.total)
        setTotalAgents(agents.filter((a) => a.is_active).length)
        setTerrenoCount(properties.items.filter((p: Property) => p.property_type === 'terreno').length)
        setLoteCount(properties.items.filter((p: Property) => p.property_type === 'lote').length)
        setTotalViews7d(overview.totals.views_7d)
        setTotalWhatsApp7d(overview.totals.whatsapp_clicks_7d)
        setAnalytics(overview)
      } finally {
        setLoading(false)
        setAnalyticsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-page-title font-semibold text-slate-900">Painel administrativo</h1>
        <p className="type-page-lead mt-1 text-slate-500">Gerencie corretores e todos os anúncios do site</p>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto scroll-snap-x px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-6">
        <StatCard label="Anúncios" value={loading ? '—' : totalProperties} className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
        <StatCard label="Corretores ativos" value={loading ? '—' : totalAgents} className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
        <StatCard label="Terrenos" value={loading ? '—' : terrenoCount} className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
        <StatCard label="Lotes" value={loading ? '—' : loteCount} className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
        <StatCard label="Views (7d)" value={loading ? '—' : totalViews7d} className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
        <StatCard label="WhatsApp (7d)" value={loading ? '—' : totalWhatsApp7d} highlight className="scroll-snap-item min-w-[9rem] shrink-0 md:min-w-0 md:shrink" />
      </div>

      <PerformanceOverview
        data={analytics}
        loading={analyticsLoading}
        title="Desempenho da operação"
        subtitle="Métricas consolidadas de todos os anúncios no site"
      />

      <section>
        <h2 className="type-section-label mb-3 font-semibold uppercase text-slate-500">Ações rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            to="/corretores?novo=1"
            icon="👤"
            title="Cadastrar corretor"
            description="Nome, CRECI, WhatsApp e acesso ao painel"
            variant="primary"
          />
          <ActionCard
            to="/imoveis?novo=1"
            icon="🏞️"
            title="Novo anúncio"
            description="Publicar terreno ou lote em nome de um corretor"
          />
          <ActionCard
            to="/imoveis"
            icon="📋"
            title="Ver todos os anúncios"
            description="Listar, editar e moderar terrenos e lotes"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="type-section-label font-semibold uppercase text-slate-500">Opções avançadas</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          <AdvancedLink to="/corretores" title="Gerenciar corretores" desc="Editar, desativar ou redefinir senha" />
          <AdvancedLink to="/imoveis" title="Moderar anúncios" desc="Reatribuir corretor, editar ou remover imóveis" />
        </ul>
      </section>
    </div>
  )
}

function StatCard({ label, value, highlight, className = '' }: { label: string; value: string | number; highlight?: boolean; className?: string }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${className} ${
        highlight ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className={`type-section-label font-medium ${highlight ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold xl:text-3xl ${highlight ? 'text-emerald-900' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function AdvancedLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between py-3 transition hover:text-blue-700">
        <div>
          <p className="font-medium text-slate-900 xl:text-base">{title}</p>
          <p className="type-page-lead text-slate-500">{desc}</p>
        </div>
        <span className="text-slate-400">→</span>
      </Link>
    </li>
  )
}
