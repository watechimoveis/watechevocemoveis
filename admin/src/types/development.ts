export interface PaymentScenario {
  id: string
  scenario_number: number
  label: string | null
  down_payment_pct: string | number
  installments: number
}

export interface Development {
  id: string
  name: string
  location: string | null
  total_lots: number | null
  total_area_m2: string | number | null
  sales_start_date: string | null
  delivery_forecast_date: string | null
  estimated_vgv: string | number | null
  default_down_payment_pct: string | number | null
  default_installments: number | null
  unsold_lots_pct: string | number | null
  tma_monthly_pct: string | number | null
  projected_inflation_pct: string | number | null
  financing_interest_pct: string | number | null
  iss_pct: string | number | null
  pis_pct: string | number | null
  cofins_pct: string | number | null
  csll_pct: string | number | null
  irpj_pct: string | number | null
  sales_projection_months?: number | null
  sales_projection_mode?: SalesProjectionMode | null
  created_at: string
  updated_at: string
  payment_scenarios: PaymentScenario[]
  costs?: DevelopmentCost[]
  costs_summary?: DevelopmentCostsSummary | null
}

export interface DevelopmentListResponse {
  items: Development[]
  total: number
}

export interface PaymentScenarioPayload {
  scenario_number: number
  label?: string | null
  down_payment_pct: number
  installments: number
}

export interface DevelopmentPayload {
  name: string
  location?: string | null
  total_lots?: number | null
  total_area_m2?: number | null
  sales_start_date?: string | null
  delivery_forecast_date?: string | null
  estimated_vgv?: number | null
  default_down_payment_pct?: number | null
  default_installments?: number | null
  unsold_lots_pct?: number | null
  tma_monthly_pct?: number | null
  projected_inflation_pct?: number | null
  financing_interest_pct?: number | null
  iss_pct?: number | null
  pis_pct?: number | null
  cofins_pct?: number | null
  csll_pct?: number | null
  irpj_pct?: number | null
  payment_scenarios?: PaymentScenarioPayload[]
}

export const DEFAULT_PAYMENT_SCENARIOS: PaymentScenarioPayload[] = [
  { scenario_number: 1, label: 'Cenário 1 — 10% + 120x', down_payment_pct: 10, installments: 120 },
  { scenario_number: 2, label: 'Cenário 2 — 20% + 80x', down_payment_pct: 20, installments: 80 },
  { scenario_number: 3, label: 'Cenário 3 — 30% + 60x', down_payment_pct: 30, installments: 60 },
  { scenario_number: 4, label: 'Cenário 4 — 100% à vista', down_payment_pct: 100, installments: 0 },
]

export type CostNature = 'fixed' | 'variable'
export type CostAmountType = 'fixed' | 'per_lot' | 'per_m2' | 'percent_vgv'

export interface DevelopmentCost {
  id: string
  category_code: string
  label: string
  cost_nature: CostNature
  amount_type: CostAmountType
  amount: string | number
  notes: string | null
  sort_order: number
  computed_total?: string | number
}

export interface DevelopmentCostsSummary {
  total: string | number
  fixed_total: string | number
  variable_total: string | number
}

export interface DevelopmentCostsResponse {
  items: DevelopmentCost[]
  summary: DevelopmentCostsSummary
}

export interface DevelopmentCostUpdatePayload {
  category_code: string
  label?: string
  cost_nature?: CostNature
  amount_type?: CostAmountType
  amount?: number
  notes?: string | null
}

export const COST_NATURE_LABELS: Record<CostNature, string> = {
  fixed: 'Fixo',
  variable: 'Variável',
}

export const COST_AMOUNT_TYPE_LABELS: Record<CostAmountType, string> = {
  fixed: 'Valor fixo (R$)',
  per_lot: 'R$ por lote',
  per_m2: 'R$ por m²',
  percent_vgv: '% do VGV',
}

export type SalesProjectionMode = 'lots' | 'percent'

export interface SalesProjectionMonth {
  id: string
  month_number: number
  lots_count: number
  percent_of_total: string | number | null
  computed_lots: number
  cumulative_lots: number
}

export interface SalesProjectionSummary {
  target_sellable_lots: number
  total_projected_lots: number
  total_projected_percent: string | number
  remaining_lots: number
  projection_months: number
  projection_mode: SalesProjectionMode
}

export interface SalesProjectionResponse {
  items: SalesProjectionMonth[]
  summary: SalesProjectionSummary
}

export interface SalesProjectionMonthUpdatePayload {
  month_number: number
  lots_count?: number
  percent_of_total?: number
}

export const SALES_PROJECTION_MODE_LABELS: Record<SalesProjectionMode, string> = {
  lots: 'Quantidade de lotes',
  percent: '% do total vendável',
}

export const PROJECTION_HORIZON_OPTIONS = [12, 24, 36, 48, 60] as const

export interface ScenarioAnalysisResult {
  scenario_number: number
  scenario_label: string | null
  down_payment_pct: string | number
  installments: number
  vpl: string | number
  tir_monthly_pct: string | number | null
  payback_months: number | null
  break_even_lots: number | null
  vpl_viable: boolean
  tir_attractive: boolean
  total_inflows: string | number
  total_outflows: string | number
}

export interface MonthlyCashFlowRow {
  month_number: number
  inflows: string | number
  outflows: string | number
  net_cash_flow: string | number
  cumulative_cash_flow: string | number
  discounted_net: string | number
  cumulative_vpl: string | number
}

export interface DevelopmentAnalysisResponse {
  development_id: string
  selected_scenario: number
  tma_monthly_pct: string | number
  target_sellable_lots: number
  lot_price: string | number
  fixed_costs: string | number
  variable_costs_total: string | number
  unit_variable_cost: string | number
  unit_contribution_margin: string | number
  total_tax_rate_pct: string | number
  warnings: string[]
  scenarios: ScenarioAnalysisResult[]
  monthly_cash_flows: MonthlyCashFlowRow[]
}

export interface FinancialDashboardSummary {
  total_developments: number
  complete_studies: number
  viable_by_vpl: number
  attractive_by_tir: number
  total_vgv: string | number
  total_vpl: string | number
  avg_tir_monthly_pct: string | number | null
  reference_scenario: number
}

export interface DevelopmentDashboardItem {
  id: string
  name: string
  location: string | null
  estimated_vgv: string | number | null
  target_sellable_lots: number
  total_costs: string | number
  reference_scenario: number
  vpl: string | number | null
  tir_monthly_pct: string | number | null
  payback_months: number | null
  break_even_lots: number | null
  vpl_viable: boolean | null
  tir_attractive: boolean | null
  best_scenario_number: number | null
  best_vpl: string | number | null
  any_scenario_viable: boolean
  is_complete: boolean
  warnings_count: number
}

export interface FinancialDashboardResponse {
  summary: FinancialDashboardSummary
  items: DevelopmentDashboardItem[]
}
