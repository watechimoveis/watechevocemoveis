import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getFinancialDashboard } from '../../services/developmentsService'
import type { FinancialDashboardResponse } from '../../types/development'
import { ActionCard } from '../ui/ActionCard'

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% a.m.`
}

export function FinancialDashboard() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState<FinancialDashboardResponse | null>(null)
  const [scenario, setScenario] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        setData(await getFinancialDashboard(scenario))
      } catch {
        setError('Erro ao carregar dashboard financeiro.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [scenario])

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="type-page-title font-semibold text-slate-900">Módulo financeiro</h1>
          <p className="type-page-lead mt-1 text-slate-500">
            Dashboard consolidado — VPL, TIR, payback e viabilidade dos loteamentos.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Cenário de referência</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                Cenário {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
        <p className="text-sm text-violet-900">
          Olá, <strong>{user?.name?.split(' ')[0]}</strong>. Acompanhe a viabilidade de todos os loteamentos em um
          só lugar. Indicadores calculados com custos, projeção de vendas e cenário de pagamento selecionado.
        </p>
        {isAdmin && (
          <p className="mt-3 text-sm text-violet-800/80">
            Gerencie a equipe em{' '}
            <Link to="/equipe" className="font-semibold text-violet-700 underline">
              Equipe
            </Link>
            .
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="-mx-4 flex gap-3 overflow-x-auto scroll-snap-x px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-6">
        <StatCard label="Loteamentos" value={loading ? '—' : summary?.total_developments ?? 0} />
        <StatCard label="Estudos completos" value={loading ? '—' : summary?.complete_studies ?? 0} />
        <StatCard label="Viáveis (VPL > 0)" value={loading ? '—' : summary?.viable_by_vpl ?? 0} highlight />
        <StatCard label="TIR > TMA" value={loading ? '—' : summary?.attractive_by_tir ?? 0} />
        <StatCard label="VGV total" value={loading ? '—' : formatCurrency(summary?.total_vgv)} />
        <StatCard label="VPL total" value={loading ? '—' : formatCurrency(summary?.total_vpl)} highlight />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="VPL"
          value={loading ? '—' : formatCurrency(summary?.total_vpl)}
          hint="Soma do VPL (cenário de referência)"
          positive={summary ? Number(summary.total_vpl) > 0 : undefined}
        />
        <KpiCard
          label="TIR média"
          value={loading ? '—' : formatPercent(summary?.avg_tir_monthly_pct)}
          hint="Taxa interna de retorno mensal média"
        />
        <KpiCard
          label="Viáveis"
          value={loading ? '—' : `${summary?.viable_by_vpl ?? 0} / ${summary?.total_developments ?? 0}`}
          hint="Loteamentos com VPL positivo"
          positive={summary ? summary.viable_by_vpl > 0 : undefined}
        />
        <KpiCard
          label="Ponto de equilíbrio"
          value={loading ? '—' : 'Ver tabela'}
          hint="Lotes mínimos para cobrir custos fixos"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          to="/financeiro/loteamentos"
          icon="🏘️"
          title="Loteamentos"
          description="Cadastro, custos, projeção e análise detalhada."
        />
        <ActionCard
          to="/financeiro/loteamentos?novo=1"
          icon="➕"
          title="Novo loteamento"
          description="Iniciar estudo de viabilidade."
          variant="primary"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="type-section-label font-semibold uppercase text-slate-500">Loteamentos — indicadores</h2>
          <Link to="/financeiro/loteamentos" className="text-sm font-medium text-violet-700 hover:underline">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : !data?.items.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">Nenhum loteamento cadastrado.</p>
            <Link
              to="/financeiro/loteamentos?novo=1"
              className="mt-3 inline-block text-sm font-medium text-violet-700 hover:underline"
            >
              Cadastrar primeiro loteamento
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Loteamento</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">VGV</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">VPL</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">TIR</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Payback</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Equilíbrio</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link to="/financeiro/loteamentos" className="font-medium text-violet-700 hover:underline">
                          {item.name}
                        </Link>
                        {item.location && (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{item.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.estimated_vgv)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.vpl_viable ? 'font-medium text-emerald-700' : 'text-slate-700'}>
                          {formatCurrency(item.vpl)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatPercent(item.tir_monthly_pct)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.payback_months != null ? `${item.payback_months} m` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.break_even_lots != null ? `${item.break_even_lots} lotes` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!item.is_complete ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Incompleto
                          </span>
                        ) : item.vpl_viable && item.tir_attractive ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Viável
                          </span>
                        ) : item.any_scenario_viable ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Viável em outro cenário
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Revisar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`scroll-snap-item min-w-[9rem] shrink-0 rounded-xl border p-4 md:min-w-0 md:shrink ${
        highlight ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-violet-900' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  positive,
}: {
  label: string
  value: string
  hint: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          positive === undefined ? 'text-slate-900' : positive ? 'text-emerald-700' : 'text-slate-400'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
