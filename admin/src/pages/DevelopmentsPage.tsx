import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import {
  createDevelopment,
  deleteDevelopment,
  getDevelopment,
  listDevelopments,
  updateDevelopment,
  updateDevelopmentCosts,
  getSalesProjection,
  updateSalesProjection,
  getDevelopmentAnalysis,
} from '../services/developmentsService'
import { HttpError } from '../services/api'
import {
  COST_AMOUNT_TYPE_LABELS,
  COST_NATURE_LABELS,
  DEFAULT_PAYMENT_SCENARIOS,
  PROJECTION_HORIZON_OPTIONS,
  SALES_PROJECTION_MODE_LABELS,
  type CostAmountType,
  type CostNature,
  type Development,
  type DevelopmentAnalysisResponse,
  type DevelopmentCost,
  type DevelopmentPayload,
  type PaymentScenarioPayload,
  type SalesProjectionMode,
  type SalesProjectionSummary,
} from '../types/development'

type ModalMode = 'create' | 'edit' | null
type FormTab = 'geral' | 'custos' | 'projecao' | 'analise'

interface CostFormRow {
  category_code: string
  label: string
  cost_nature: CostNature
  amount_type: CostAmountType
  amount: string
  notes: string
}

interface ProjectionFormRow {
  month_number: number
  lots_count: string
  percent_of_total: string
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function parseOptionalInt(value: string): number | undefined {
  const n = parseOptionalNumber(value)
  if (n === undefined) return undefined
  return Math.trunc(n)
}

function toInputDate(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function formatPercent(value: string | number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}% a.m.`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function computeLineTotal(
  cost: Pick<CostFormRow, 'amount_type' | 'amount'>,
  ctx: { vgv: number; lots: number; areaM2: number },
): number {
  const amount = parseOptionalNumber(cost.amount) ?? 0
  switch (cost.amount_type) {
    case 'fixed':
      return amount
    case 'per_lot':
      return amount * ctx.lots
    case 'per_m2':
      return amount * ctx.areaM2
    case 'percent_vgv':
      return (amount / 100) * ctx.vgv
    default:
      return 0
  }
}

function summarizeCosts(
  costs: CostFormRow[],
  ctx: { vgv: number; lots: number; areaM2: number },
) {
  return costs.reduce(
    (acc, cost) => {
      const lineTotal = computeLineTotal(cost, ctx)
      acc.total += lineTotal
      if (cost.cost_nature === 'variable') acc.variable += lineTotal
      else acc.fixed += lineTotal
      return acc
    },
    { total: 0, fixed: 0, variable: 0 },
  )
}

function costsToFormRows(costs: DevelopmentCost[]): CostFormRow[] {
  return costs
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cost) => ({
      category_code: cost.category_code,
      label: cost.label,
      cost_nature: cost.cost_nature,
      amount_type: cost.amount_type,
      amount: cost.amount?.toString() || '',
      notes: cost.notes || '',
    }))
}

function projectionToFormRows(items: { month_number: number; lots_count: number; percent_of_total: string | number | null }[]): ProjectionFormRow[] {
  return items
    .slice()
    .sort((a, b) => a.month_number - b.month_number)
    .map((row) => ({
      month_number: row.month_number,
      lots_count: row.lots_count?.toString() || '0',
      percent_of_total: row.percent_of_total?.toString() || '0',
    }))
}

function monthReferenceLabel(salesStartDate: string, monthNumber: number): string {
  if (!salesStartDate) return `Mês ${monthNumber}`
  const date = new Date(`${salesStartDate.slice(0, 10)}T12:00:00`)
  date.setMonth(date.getMonth() + monthNumber - 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date)
}

function previewProjection(
  rows: ProjectionFormRow[],
  mode: SalesProjectionMode,
  targetSellableLots: number,
) {
  let cumulative = 0
  let totalLots = 0
  let totalPercent = 0
  const computedRows = rows.map((row) => {
    const lots =
      mode === 'percent'
        ? Math.round(((parseOptionalNumber(row.percent_of_total) ?? 0) / 100) * targetSellableLots)
        : parseOptionalInt(row.lots_count) ?? 0
    cumulative += lots
    totalLots += lots
    if (mode === 'percent') totalPercent += parseOptionalNumber(row.percent_of_total) ?? 0
    return { ...row, computedLots: lots, cumulativeLots: cumulative }
  })
  return {
    rows: computedRows,
    totalLots,
    totalPercent,
    remainingLots: targetSellableLots - totalLots,
  }
}

function emptyFormState() {
  return {
    name: '',
    location: '',
    totalLots: '',
    totalAreaM2: '',
    salesStartDate: '',
    deliveryForecastDate: '',
    estimatedVgv: '',
    defaultDownPaymentPct: '',
    defaultInstallments: '',
    unsoldLotsPct: '',
    tmaMonthlyPct: '',
    projectedInflationPct: '',
    financingInterestPct: '',
    issPct: '',
    pisPct: '',
    cofinsPct: '',
    csllPct: '',
    irpjPct: '',
    scenarios: DEFAULT_PAYMENT_SCENARIOS.map((s) => ({ ...s })),
  }
}

export function DevelopmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Development[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Development | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<FormTab>('geral')
  const [toast, setToast] = useState('')
  const [form, setForm] = useState(emptyFormState())
  const [costsForm, setCostsForm] = useState<CostFormRow[]>([])
  const [projectionForm, setProjectionForm] = useState<ProjectionFormRow[]>([])
  const [projectionMode, setProjectionMode] = useState<SalesProjectionMode>('lots')
  const [projectionMonths, setProjectionMonths] = useState(36)
  const [projectionSummary, setProjectionSummary] = useState<SalesProjectionSummary | null>(null)
  const [projectionLoading, setProjectionLoading] = useState(false)
  const [analysis, setAnalysis] = useState<DevelopmentAnalysisResponse | null>(null)
  const [analysisScenario, setAnalysisScenario] = useState(1)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listDevelopments()
      setItems(data.items)
    } catch {
      setError('Erro ao carregar loteamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      openCreate()
      searchParams.delete('novo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (activeTab !== 'projecao' || !selected || modalMode !== 'edit') return
    void loadSalesProjection(selected.id)
  }, [activeTab, selected?.id, modalMode])

  useEffect(() => {
    if (activeTab !== 'analise' || !selected || modalMode !== 'edit') return
    void loadAnalysis(selected.id, analysisScenario)
  }, [activeTab, selected?.id, modalMode, analysisScenario])

  async function loadAnalysis(id: string, scenarioNumber: number) {
    setAnalysisLoading(true)
    try {
      setAnalysis(await getDevelopmentAnalysis(id, scenarioNumber))
    } catch {
      setError('Erro ao carregar análise financeira.')
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function loadSalesProjection(id: string) {
    setProjectionLoading(true)
    try {
      const data = await getSalesProjection(id)
      setProjectionForm(projectionToFormRows(data.items))
      setProjectionMode(data.summary.projection_mode)
      setProjectionMonths(data.summary.projection_months)
      setProjectionSummary(data.summary)
    } catch {
      setError('Erro ao carregar projeção de vendas.')
    } finally {
      setProjectionLoading(false)
    }
  }

  function openCreate() {
    setSelected(null)
    setForm(emptyFormState())
    setCostsForm([])
    setProjectionForm([])
    setProjectionSummary(null)
    setProjectionMode('lots')
    setProjectionMonths(36)
    setAnalysis(null)
    setAnalysisScenario(1)
    setActiveTab('geral')
    setModalMode('create')
  }

  async function openEdit(item: Development) {
    setLoadingDetail(true)
    setError('')
    try {
      const full = await getDevelopment(item.id)
      setSelected(full)
      setForm({
        name: full.name,
        location: full.location || '',
        totalLots: full.total_lots?.toString() || '',
        totalAreaM2: full.total_area_m2?.toString() || '',
        salesStartDate: toInputDate(full.sales_start_date),
        deliveryForecastDate: toInputDate(full.delivery_forecast_date),
        estimatedVgv: full.estimated_vgv?.toString() || '',
        defaultDownPaymentPct: full.default_down_payment_pct?.toString() || '',
        defaultInstallments: full.default_installments?.toString() || '',
        unsoldLotsPct: full.unsold_lots_pct?.toString() || '',
        tmaMonthlyPct: full.tma_monthly_pct?.toString() || '',
        projectedInflationPct: full.projected_inflation_pct?.toString() || '',
        financingInterestPct: full.financing_interest_pct?.toString() || '',
        issPct: full.iss_pct?.toString() || '',
        pisPct: full.pis_pct?.toString() || '',
        cofinsPct: full.cofins_pct?.toString() || '',
        csllPct: full.csll_pct?.toString() || '',
        irpjPct: full.irpj_pct?.toString() || '',
        scenarios:
          full.payment_scenarios.length > 0
            ? full.payment_scenarios
                .slice()
                .sort((a, b) => a.scenario_number - b.scenario_number)
                .map((s) => ({
                  scenario_number: s.scenario_number,
                  label: s.label || undefined,
                  down_payment_pct: Number(s.down_payment_pct),
                  installments: s.installments,
                }))
            : DEFAULT_PAYMENT_SCENARIOS.map((s) => ({ ...s })),
      })
      setCostsForm(costsToFormRows(full.costs || []))
      setActiveTab('geral')
      setModalMode('edit')
    } catch {
      setError('Erro ao carregar loteamento.')
    } finally {
      setLoadingDetail(false)
    }
  }

  function closeModal() {
    if (submitting) return
    setModalMode(null)
    setSelected(null)
  }

  function buildPayload(): DevelopmentPayload {
    return {
      name: form.name.trim(),
      location: form.location.trim() || null,
      total_lots: parseOptionalInt(form.totalLots) ?? null,
      total_area_m2: parseOptionalNumber(form.totalAreaM2) ?? null,
      sales_start_date: form.salesStartDate || null,
      delivery_forecast_date: form.deliveryForecastDate || null,
      estimated_vgv: parseOptionalNumber(form.estimatedVgv) ?? null,
      default_down_payment_pct: parseOptionalNumber(form.defaultDownPaymentPct) ?? null,
      default_installments: parseOptionalInt(form.defaultInstallments) ?? null,
      unsold_lots_pct: parseOptionalNumber(form.unsoldLotsPct) ?? null,
      tma_monthly_pct: parseOptionalNumber(form.tmaMonthlyPct) ?? null,
      projected_inflation_pct: parseOptionalNumber(form.projectedInflationPct) ?? null,
      financing_interest_pct: parseOptionalNumber(form.financingInterestPct) ?? null,
      iss_pct: parseOptionalNumber(form.issPct) ?? null,
      pis_pct: parseOptionalNumber(form.pisPct) ?? null,
      cofins_pct: parseOptionalNumber(form.cofinsPct) ?? null,
      csll_pct: parseOptionalNumber(form.csllPct) ?? null,
      irpj_pct: parseOptionalNumber(form.irpjPct) ?? null,
      payment_scenarios: form.scenarios.map((s) => ({
        scenario_number: s.scenario_number,
        label: s.label?.trim() || null,
        down_payment_pct: s.down_payment_pct,
        installments: s.installments,
      })),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Informe o nome do loteamento.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const payload = buildPayload()
      if (modalMode === 'create') {
        await createDevelopment(payload)
        setToast('Loteamento cadastrado')
      } else if (selected) {
        await updateDevelopment(selected.id, payload)
        setToast('Loteamento atualizado')
      }
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar loteamento.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!selected || !window.confirm(`Excluir "${selected.name}"? Esta ação não pode ser desfeita.`)) return
    setSubmitting(true)
    setError('')
    try {
      await deleteDevelopment(selected.id)
      setToast('Loteamento excluído')
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao excluir loteamento.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateCost(index: number, patch: Partial<CostFormRow>) {
    setCostsForm((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const costContext = {
    vgv: parseOptionalNumber(form.estimatedVgv) ?? 0,
    lots: parseOptionalInt(form.totalLots) ?? 0,
    areaM2: parseOptionalNumber(form.totalAreaM2) ?? 0,
  }
  const costPreview = summarizeCosts(costsForm, costContext)

  async function handleSaveCosts(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    setSubmitting(true)
    setError('')
    try {
      const response = await updateDevelopmentCosts(
        selected.id,
        costsForm.map((row) => ({
          category_code: row.category_code,
          label: row.label.trim(),
          cost_nature: row.cost_nature,
          amount_type: row.amount_type,
          amount: parseOptionalNumber(row.amount) ?? 0,
          notes: row.notes.trim() || null,
        })),
      )
      setCostsForm(costsToFormRows(response.items))
      setToast('Custos salvos')
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar custos.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateProjection(index: number, patch: Partial<ProjectionFormRow>) {
    setProjectionForm((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const targetSellableLots = (() => {
    const total = parseOptionalInt(form.totalLots) ?? 0
    const unsoldPct = parseOptionalNumber(form.unsoldLotsPct) ?? 0
    return Math.max(0, Math.round(total * (1 - unsoldPct / 100)))
  })()

  const projectionPreview = previewProjection(projectionForm, projectionMode, targetSellableLots)

  function resizeProjectionMonths(months: number) {
    setProjectionMonths(months)
    setProjectionForm((prev) => {
      const byMonth = new Map(prev.map((row) => [row.month_number, row]))
      return Array.from({ length: months }, (_, index) => {
        const monthNumber = index + 1
        return byMonth.get(monthNumber) || { month_number: monthNumber, lots_count: '0', percent_of_total: '0' }
      })
    })
  }

  function distributeProjectionUniform() {
    const months = projectionMonths
    if (months <= 0) return
    if (projectionMode === 'percent') {
      const base = Math.floor((100 / months) * 100) / 100
      const rows = Array.from({ length: months }, (_, index) => ({
        month_number: index + 1,
        lots_count: '0',
        percent_of_total: index === months - 1 ? (100 - base * (months - 1)).toFixed(2) : base.toFixed(2),
      }))
      setProjectionForm(rows)
      return
    }
    const base = Math.floor(targetSellableLots / months)
    const remainder = targetSellableLots % months
    setProjectionForm(
      Array.from({ length: months }, (_, index) => ({
        month_number: index + 1,
        lots_count: String(base + (index < remainder ? 1 : 0)),
        percent_of_total: '0',
      })),
    )
  }

  async function handleSaveProjection(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    setSubmitting(true)
    setError('')
    try {
      const response = await updateSalesProjection(selected.id, {
        projection_months: projectionMonths,
        projection_mode: projectionMode,
        items: projectionForm.map((row) => ({
          month_number: row.month_number,
          lots_count: parseOptionalInt(row.lots_count) ?? 0,
          percent_of_total: parseOptionalNumber(row.percent_of_total) ?? 0,
        })),
      })
      setProjectionForm(projectionToFormRows(response.items))
      setProjectionSummary(response.summary)
      setProjectionMode(response.summary.projection_mode)
      setProjectionMonths(response.summary.projection_months)
      setToast('Projeção salva')
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao salvar projeção.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateScenario(index: number, patch: Partial<PaymentScenarioPayload>) {
    setForm((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/financeiro" className="text-sm font-medium text-violet-700 hover:underline">
            ← Financeiro
          </Link>
          <h1 className="type-page-title mt-2 font-semibold text-slate-900">Loteamentos</h1>
          <p className="type-page-lead mt-1 text-slate-500">
            Cadastro mestre para viabilidade — dados gerais, custos, projeção mensal e índices.
          </p>
        </div>
        <Button onClick={openCreate}>Novo loteamento</Button>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {error && !modalMode && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">Nenhum loteamento cadastrado.</p>
          <Button className="mt-4" onClick={openCreate}>
            Cadastrar primeiro loteamento
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Local</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Lotes</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">VGV est.</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Início vendas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-slate-600">{item.location || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.total_lots ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.estimated_vgv)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.sales_start_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} disabled={loadingDetail}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Novo loteamento' : 'Editar loteamento'}
        wide
      >
        {modalMode === 'edit' && (
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            {(['geral', 'custos', 'projecao', 'analise'] as FormTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'geral'
                  ? 'Geral'
                  : tab === 'custos'
                    ? 'Custos'
                    : tab === 'projecao'
                      ? 'Projeção'
                      : 'Análise'}
              </button>
            ))}
          </div>
        )}

        {error && modalMode && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {activeTab === 'custos' && modalMode === 'edit' ? (
          <form onSubmit={handleSaveCosts} className="space-y-6">
            <p className="text-sm text-slate-600">
              Categorias padrão de viabilidade de loteamentos. O total estimado usa VGV, lotes e área da aba Geral.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Categoria</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Natureza</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Tipo</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Valor</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Total est.</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costsForm.map((row, index) => (
                    <tr key={row.category_code}>
                      <td className="px-3 py-2 font-medium text-slate-900">{row.label}</td>
                      <td className="px-3 py-2">
                        <select
                          value={row.cost_nature}
                          onChange={(e) => updateCost(index, { cost_nature: e.target.value as CostNature })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        >
                          {(Object.keys(COST_NATURE_LABELS) as CostNature[]).map((key) => (
                            <option key={key} value={key}>
                              {COST_NATURE_LABELS[key]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.amount_type}
                          onChange={(e) => updateCost(index, { amount_type: e.target.value as CostAmountType })}
                          className="w-full min-w-[9rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        >
                          {(Object.keys(COST_AMOUNT_TYPE_LABELS) as CostAmountType[]).map((key) => (
                            <option key={key} value={key}>
                              {COST_AMOUNT_TYPE_LABELS[key]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          value={row.amount}
                          onChange={(e) => updateCost(index, { amount: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatCurrency(computeLineTotal(row, costContext))}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.notes}
                          onChange={(e) => updateCost(index, { notes: e.target.value })}
                          placeholder="Opcional"
                          className="w-full min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Custos fixos</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(costPreview.fixed)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Custos variáveis</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(costPreview.variable)}</p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase text-violet-700">Total estimado</p>
                <p className="mt-1 text-lg font-semibold text-violet-900">{formatCurrency(costPreview.total)}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={submitting}>
                Excluir loteamento
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar custos'}
                </Button>
              </div>
            </div>
          </form>
        ) : activeTab === 'projecao' && modalMode === 'edit' ? (
          <form onSubmit={handleSaveProjection} className="space-y-6">
            <p className="text-sm text-slate-600">
              Projeção mensal padrão de mercado — informe lotes por mês ou percentual do total vendável (descontando
              lotes não vendidos da aba Geral).
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Modo de projeção</label>
                <select
                  value={projectionMode}
                  onChange={(e) => setProjectionMode(e.target.value as SalesProjectionMode)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {(Object.keys(SALES_PROJECTION_MODE_LABELS) as SalesProjectionMode[]).map((key) => (
                    <option key={key} value={key}>
                      {SALES_PROJECTION_MODE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Horizonte (meses)</label>
                <select
                  value={projectionMonths}
                  onChange={(e) => resizeProjectionMonths(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {PROJECTION_HORIZON_OPTIONS.map((months) => (
                    <option key={months} value={months}>
                      {months} meses
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Meta vendável</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{targetSellableLots} lotes</p>
                <p className="mt-1 text-xs text-slate-500">
                  Total de lotes menos o percentual de não vendidos (aba Geral).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={distributeProjectionUniform}>
                Distribuir uniformemente
              </Button>
            </div>

            {projectionLoading ? (
              <p className="text-sm text-slate-500">Carregando projeção...</p>
            ) : (
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Mês</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Referência</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">
                        {projectionMode === 'percent' ? '% vendável' : 'Lotes'}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Lotes mês</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectionPreview.rows.map((row, index) => (
                      <tr key={row.month_number}>
                        <td className="px-3 py-2 font-medium text-slate-900">M{row.month_number}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {monthReferenceLabel(form.salesStartDate, row.month_number)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            inputMode="decimal"
                            value={projectionMode === 'percent' ? row.percent_of_total : row.lots_count}
                            onChange={(e) =>
                              updateProjection(
                                index,
                                projectionMode === 'percent'
                                  ? { percent_of_total: e.target.value }
                                  : { lots_count: e.target.value },
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.computedLots}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.cumulativeLots}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Total projetado</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {projectionPreview.totalLots} lotes
                  {projectionMode === 'percent' && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({projectionPreview.totalPercent.toFixed(2)}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Saldo vs meta</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    projectionPreview.remainingLots === 0
                      ? 'text-emerald-700'
                      : projectionPreview.remainingLots < 0
                        ? 'text-red-600'
                        : 'text-amber-700'
                  }`}
                >
                  {projectionPreview.remainingLots} lotes
                </p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase text-violet-700">Horizonte</p>
                <p className="mt-1 text-lg font-semibold text-violet-900">
                  {projectionSummary?.projection_months ?? projectionMonths} meses
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={submitting}>
                Excluir loteamento
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || projectionLoading}>
                  {submitting ? 'Salvando...' : 'Salvar projeção'}
                </Button>
              </div>
            </div>
          </form>
        ) : activeTab === 'analise' && modalMode === 'edit' ? (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Indicadores de viabilidade com base em custos, projeção de vendas, VGV, impostos e cenários de pagamento.
              TMA e TIR em taxa mensual.
            </p>

            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Cenário para fluxo de caixa</label>
                <select
                  value={analysisScenario}
                  onChange={(e) => setAnalysisScenario(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      Cenário {n}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => selected && loadAnalysis(selected.id, analysisScenario)}>
                Recalcular
              </Button>
            </div>

            {analysisLoading ? (
              <p className="text-sm text-slate-500">Calculando indicadores...</p>
            ) : analysis ? (
              <>
                {analysis.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {analysis.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {analysis.scenarios.map((scenario) => (
                    <button
                      key={scenario.scenario_number}
                      type="button"
                      onClick={() => setAnalysisScenario(scenario.scenario_number)}
                      className={`rounded-xl border p-4 text-left transition ${
                        analysisScenario === scenario.scenario_number
                          ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Cenário {scenario.scenario_number}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {scenario.scenario_label || `${scenario.down_payment_pct}% + ${scenario.installments}x`}
                      </p>
                      <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(scenario.vpl)}</p>
                      <p className="text-xs text-slate-500">VPL</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className={scenario.vpl_viable ? 'text-emerald-700' : 'text-red-600'}>
                          {scenario.vpl_viable ? 'VPL viável' : 'VPL negativo'}
                        </span>
                        <span className={scenario.tir_attractive ? 'text-emerald-700' : 'text-slate-500'}>
                          {scenario.tir_attractive ? 'TIR > TMA' : 'TIR ≤ TMA'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {(() => {
                  const selectedResult = analysis.scenarios.find((s) => s.scenario_number === analysisScenario)
                  if (!selectedResult) return null
                  return (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-xs font-semibold uppercase text-violet-700">VPL</p>
                        <p className="mt-1 text-xl font-bold text-violet-900">{formatCurrency(selectedResult.vpl)}</p>
                        <p className="mt-1 text-xs text-violet-800">
                          {selectedResult.vpl_viable ? 'Projeto viável (VPL > 0)' : 'Projeto inviável pelo VPL'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">TIR mensal</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {formatPercent(selectedResult.tir_monthly_pct)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          TMA: {formatPercent(analysis.tma_monthly_pct)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">Payback</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {selectedResult.payback_months != null ? `${selectedResult.payback_months} meses` : '—'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Retorno do investimento inicial</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">Ponto de equilíbrio</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {selectedResult.break_even_lots != null ? `${selectedResult.break_even_lots} lotes` : '—'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Margem unit.: {formatCurrency(analysis.unit_contribution_margin)}
                        </p>
                      </div>
                    </div>
                  )
                })()}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-medium text-slate-700">Preço médio/lote</p>
                    <p className="mt-1 text-slate-900">{formatCurrency(analysis.lot_price)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-medium text-slate-700">Meta vendável</p>
                    <p className="mt-1 text-slate-900">{analysis.target_sellable_lots} lotes</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-medium text-slate-700">Custos fixos / variáveis</p>
                    <p className="mt-1 text-slate-900">
                      {formatCurrency(analysis.fixed_costs)} / {formatCurrency(analysis.variable_costs_total)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">
                    Fluxo de caixa — cenário {analysisScenario}
                  </h4>
                  <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Mês</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Entradas</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Saídas</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Líquido</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Acumulado</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">VPL acum.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysis.monthly_cash_flows.map((row) => (
                          <tr key={row.month_number}>
                            <td className="px-3 py-2 text-slate-900">
                              {row.month_number === 0 ? 'M0 (invest.)' : `M${row.month_number}`}
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-700">{formatCurrency(row.inflows)}</td>
                            <td className="px-3 py-2 text-right text-red-600">{formatCurrency(row.outflows)}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(row.net_cash_flow)}</td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {formatCurrency(row.cumulative_cash_flow)}
                            </td>
                            <td className="px-3 py-2 text-right text-violet-700">{formatCurrency(row.cumulative_vpl)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Nenhum dado de análise disponível.</p>
            )}

            <div className="flex justify-end border-t border-slate-200 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Geral — identificação</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input
                label="Localização"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                label="Total de lotes"
                type="number"
                min={1}
                value={form.totalLots}
                onChange={(e) => setForm({ ...form, totalLots: e.target.value })}
              />
              <Input
                label="Área total (m²)"
                inputMode="decimal"
                value={form.totalAreaM2}
                onChange={(e) => setForm({ ...form, totalAreaM2: e.target.value })}
              />
              <Input
                label="Início das vendas"
                type="date"
                value={form.salesStartDate}
                onChange={(e) => setForm({ ...form, salesStartDate: e.target.value })}
              />
              <Input
                label="Previsão de entrega"
                type="date"
                value={form.deliveryForecastDate}
                onChange={(e) => setForm({ ...form, deliveryForecastDate: e.target.value })}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vendas</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="VGV estimado (R$)"
                inputMode="decimal"
                value={form.estimatedVgv}
                onChange={(e) => setForm({ ...form, estimatedVgv: e.target.value })}
              />
              <Input
                label="Entrada padrão (%)"
                inputMode="decimal"
                value={form.defaultDownPaymentPct}
                onChange={(e) => setForm({ ...form, defaultDownPaymentPct: e.target.value })}
              />
              <Input
                label="Parcelas padrão"
                type="number"
                min={0}
                value={form.defaultInstallments}
                onChange={(e) => setForm({ ...form, defaultInstallments: e.target.value })}
              />
              <Input
                label="Lotes não vendidos (%)"
                inputMode="decimal"
                value={form.unsoldLotsPct}
                onChange={(e) => setForm({ ...form, unsoldLotsPct: e.target.value })}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Taxas mensais (% a.m.)</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="TMA"
                inputMode="decimal"
                placeholder="Ex.: 1,5"
                value={form.tmaMonthlyPct}
                onChange={(e) => setForm({ ...form, tmaMonthlyPct: e.target.value })}
              />
              <Input
                label="Inflação projetada"
                inputMode="decimal"
                value={form.projectedInflationPct}
                onChange={(e) => setForm({ ...form, projectedInflationPct: e.target.value })}
              />
              <Input
                label="Juros financiamento"
                inputMode="decimal"
                value={form.financingInterestPct}
                onChange={(e) => setForm({ ...form, financingInterestPct: e.target.value })}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Impostos (%)</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Input label="ISS" inputMode="decimal" value={form.issPct} onChange={(e) => setForm({ ...form, issPct: e.target.value })} />
              <Input label="PIS" inputMode="decimal" value={form.pisPct} onChange={(e) => setForm({ ...form, pisPct: e.target.value })} />
              <Input label="COFINS" inputMode="decimal" value={form.cofinsPct} onChange={(e) => setForm({ ...form, cofinsPct: e.target.value })} />
              <Input label="CSLL" inputMode="decimal" value={form.csllPct} onChange={(e) => setForm({ ...form, csllPct: e.target.value })} />
              <Input label="IRPJ" inputMode="decimal" value={form.irpjPct} onChange={(e) => setForm({ ...form, irpjPct: e.target.value })} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cenários de pagamento</h3>
            <div className="space-y-3">
              {form.scenarios.map((scenario, index) => (
                <div
                  key={scenario.scenario_number}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[auto_1fr_1fr_1fr]"
                >
                  <span className="flex items-center text-xs font-semibold uppercase text-slate-500">
                    #{scenario.scenario_number}
                  </span>
                  <Input
                    label="Rótulo"
                    value={scenario.label || ''}
                    onChange={(e) => updateScenario(index, { label: e.target.value })}
                  />
                  <Input
                    label="Entrada (%)"
                    inputMode="decimal"
                    value={String(scenario.down_payment_pct)}
                    onChange={(e) =>
                      updateScenario(index, { down_payment_pct: parseOptionalNumber(e.target.value) ?? 0 })
                    }
                  />
                  <Input
                    label="Parcelas"
                    type="number"
                    min={0}
                    value={String(scenario.installments)}
                    onChange={(e) =>
                      updateScenario(index, { installments: parseOptionalInt(e.target.value) ?? 0 })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
            <div>
              {modalMode === 'edit' && (
                <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={submitting}>
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
        )}
      </Modal>
    </div>
  )
}
