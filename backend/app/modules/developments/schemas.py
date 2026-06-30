from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentScenarioBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scenario_number: int = Field(ge=1, le=4)
    label: str | None = Field(default=None, max_length=80)
    down_payment_pct: Decimal = Field(ge=0, le=100)
    installments: int = Field(ge=0, le=360)


class PaymentScenarioCreate(PaymentScenarioBase):
    pass


class PaymentScenarioUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: str | None = Field(default=None, max_length=80)
    down_payment_pct: Decimal | None = Field(default=None, ge=0, le=100)
    installments: int | None = Field(default=None, ge=0, le=360)


class PaymentScenarioResponse(PaymentScenarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID


CostNature = Literal["fixed", "variable"]
CostAmountType = Literal["fixed", "per_lot", "per_m2", "percent_vgv"]


class DevelopmentCostBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    category_code: str = Field(min_length=2, max_length=40)
    label: str = Field(min_length=2, max_length=120)
    cost_nature: CostNature = "fixed"
    amount_type: CostAmountType = "fixed"
    amount: Decimal = Field(default=Decimal("0"), ge=0)
    notes: str | None = Field(default=None, max_length=500)
    sort_order: int = Field(default=0, ge=0)


class DevelopmentCostUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    category_code: str = Field(min_length=2, max_length=40)
    label: str | None = Field(default=None, min_length=2, max_length=120)
    cost_nature: CostNature | None = None
    amount_type: CostAmountType | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class DevelopmentCostsBulkUpdate(BaseModel):
    items: list[DevelopmentCostUpdate] = Field(min_length=1)


class DevelopmentCostResponse(DevelopmentCostBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    computed_total: Decimal = Field(default=Decimal("0"), ge=0)


class DevelopmentCostsSummary(BaseModel):
    total: Decimal = Field(default=Decimal("0"), ge=0)
    fixed_total: Decimal = Field(default=Decimal("0"), ge=0)
    variable_total: Decimal = Field(default=Decimal("0"), ge=0)


class DevelopmentCostsResponse(BaseModel):
    items: list[DevelopmentCostResponse]
    summary: DevelopmentCostsSummary


SalesProjectionMode = Literal["lots", "percent"]


class SalesProjectionMonthUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    month_number: int = Field(ge=1, le=120)
    lots_count: int | None = Field(default=None, ge=0)
    percent_of_total: Decimal | None = Field(default=None, ge=0, le=100)


class SalesProjectionBulkUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    projection_months: int | None = Field(default=None, ge=1, le=120)
    projection_mode: SalesProjectionMode | None = None
    items: list[SalesProjectionMonthUpdate] = Field(min_length=1)


class SalesProjectionMonthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    month_number: int
    lots_count: int
    percent_of_total: Decimal | None = None
    computed_lots: int = Field(default=0, ge=0)
    cumulative_lots: int = Field(default=0, ge=0)


class SalesProjectionSummary(BaseModel):
    target_sellable_lots: int = Field(default=0, ge=0)
    total_projected_lots: int = Field(default=0, ge=0)
    total_projected_percent: Decimal = Field(default=Decimal("0"), ge=0)
    remaining_lots: int
    projection_months: int = Field(ge=1, le=120)
    projection_mode: SalesProjectionMode


class SalesProjectionResponse(BaseModel):
    items: list[SalesProjectionMonthResponse]
    summary: SalesProjectionSummary


class DevelopmentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=2, max_length=160)
    location: str | None = Field(default=None, max_length=500)
    total_lots: int | None = Field(default=None, ge=1)
    total_area_m2: Decimal | None = Field(default=None, ge=0)
    sales_start_date: date | None = None
    delivery_forecast_date: date | None = None
    estimated_vgv: Decimal | None = Field(default=None, ge=0)
    default_down_payment_pct: Decimal | None = Field(default=None, ge=0, le=100)
    default_installments: int | None = Field(default=None, ge=0, le=360)
    unsold_lots_pct: Decimal | None = Field(default=None, ge=0, le=100)

    tma_monthly_pct: Decimal | None = Field(default=None, ge=0, le=100)
    projected_inflation_pct: Decimal | None = Field(default=None, ge=0, le=100)
    financing_interest_pct: Decimal | None = Field(default=None, ge=0, le=100)
    iss_pct: Decimal | None = Field(default=None, ge=0, le=100)
    pis_pct: Decimal | None = Field(default=None, ge=0, le=100)
    cofins_pct: Decimal | None = Field(default=None, ge=0, le=100)
    csll_pct: Decimal | None = Field(default=None, ge=0, le=100)
    irpj_pct: Decimal | None = Field(default=None, ge=0, le=100)

    sales_projection_months: int | None = Field(default=None, ge=1, le=120)
    sales_projection_mode: SalesProjectionMode | None = None


class DevelopmentCreate(DevelopmentBase):
    payment_scenarios: list[PaymentScenarioCreate] | None = None


class DevelopmentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = Field(default=None, min_length=2, max_length=160)
    location: str | None = Field(default=None, max_length=500)
    total_lots: int | None = Field(default=None, ge=1)
    total_area_m2: Decimal | None = Field(default=None, ge=0)
    sales_start_date: date | None = None
    delivery_forecast_date: date | None = None
    estimated_vgv: Decimal | None = Field(default=None, ge=0)
    default_down_payment_pct: Decimal | None = Field(default=None, ge=0, le=100)
    default_installments: int | None = Field(default=None, ge=0, le=360)
    unsold_lots_pct: Decimal | None = Field(default=None, ge=0, le=100)

    tma_monthly_pct: Decimal | None = Field(default=None, ge=0, le=100)
    projected_inflation_pct: Decimal | None = Field(default=None, ge=0, le=100)
    financing_interest_pct: Decimal | None = Field(default=None, ge=0, le=100)
    iss_pct: Decimal | None = Field(default=None, ge=0, le=100)
    pis_pct: Decimal | None = Field(default=None, ge=0, le=100)
    cofins_pct: Decimal | None = Field(default=None, ge=0, le=100)
    csll_pct: Decimal | None = Field(default=None, ge=0, le=100)
    irpj_pct: Decimal | None = Field(default=None, ge=0, le=100)

    sales_projection_months: int | None = Field(default=None, ge=1, le=120)
    sales_projection_mode: SalesProjectionMode | None = None

    payment_scenarios: list[PaymentScenarioCreate] | None = None


class DevelopmentResponse(DevelopmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    payment_scenarios: list[PaymentScenarioResponse] = Field(default_factory=list)
    costs: list[DevelopmentCostResponse] = Field(default_factory=list)
    costs_summary: DevelopmentCostsSummary | None = None


class DevelopmentListResponse(BaseModel):
    items: list[DevelopmentResponse]
    total: int


class ScenarioAnalysisResult(BaseModel):
    scenario_number: int
    scenario_label: str | None = None
    down_payment_pct: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    installments: int = Field(default=0, ge=0)
    vpl: Decimal
    tir_monthly_pct: Decimal | None = None
    payback_months: int | None = None
    break_even_lots: int | None = None
    vpl_viable: bool
    tir_attractive: bool
    total_inflows: Decimal = Field(default=Decimal("0"))
    total_outflows: Decimal = Field(default=Decimal("0"))


class MonthlyCashFlowRow(BaseModel):
    month_number: int = Field(ge=0)
    inflows: Decimal = Field(default=Decimal("0"))
    outflows: Decimal = Field(default=Decimal("0"))
    net_cash_flow: Decimal
    cumulative_cash_flow: Decimal
    discounted_net: Decimal
    cumulative_vpl: Decimal


class DevelopmentAnalysisResponse(BaseModel):
    development_id: UUID
    selected_scenario: int = Field(ge=1, le=4)
    tma_monthly_pct: Decimal = Field(default=Decimal("0"), ge=0)
    target_sellable_lots: int = Field(default=0, ge=0)
    lot_price: Decimal = Field(default=Decimal("0"), ge=0)
    fixed_costs: Decimal = Field(default=Decimal("0"), ge=0)
    variable_costs_total: Decimal = Field(default=Decimal("0"), ge=0)
    unit_variable_cost: Decimal = Field(default=Decimal("0"), ge=0)
    unit_contribution_margin: Decimal
    total_tax_rate_pct: Decimal = Field(default=Decimal("0"), ge=0)
    warnings: list[str] = Field(default_factory=list)
    scenarios: list[ScenarioAnalysisResult] = Field(default_factory=list)
    monthly_cash_flows: list[MonthlyCashFlowRow] = Field(default_factory=list)


class FinancialDashboardSummary(BaseModel):
    total_developments: int = Field(default=0, ge=0)
    complete_studies: int = Field(default=0, ge=0)
    viable_by_vpl: int = Field(default=0, ge=0)
    attractive_by_tir: int = Field(default=0, ge=0)
    total_vgv: Decimal = Field(default=Decimal("0"), ge=0)
    total_vpl: Decimal
    avg_tir_monthly_pct: Decimal | None = None
    reference_scenario: int = Field(default=1, ge=1, le=4)


class DevelopmentDashboardItem(BaseModel):
    id: UUID
    name: str
    location: str | None = None
    estimated_vgv: Decimal | None = None
    target_sellable_lots: int = Field(default=0, ge=0)
    total_costs: Decimal = Field(default=Decimal("0"), ge=0)
    reference_scenario: int = Field(default=1, ge=1, le=4)
    vpl: Decimal | None = None
    tir_monthly_pct: Decimal | None = None
    payback_months: int | None = None
    break_even_lots: int | None = None
    vpl_viable: bool | None = None
    tir_attractive: bool | None = None
    best_scenario_number: int | None = Field(default=None, ge=1, le=4)
    best_vpl: Decimal | None = None
    any_scenario_viable: bool = False
    is_complete: bool = False
    warnings_count: int = Field(default=0, ge=0)


class FinancialDashboardResponse(BaseModel):
    summary: FinancialDashboardSummary
    items: list[DevelopmentDashboardItem] = Field(default_factory=list)
