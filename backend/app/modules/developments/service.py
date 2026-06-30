from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.developments.analysis_engine import run_development_analysis
from app.modules.developments.cost_calculator import compute_line_total, summarize_costs
from app.modules.developments.dashboard_engine import build_financial_dashboard
from app.modules.developments.repository import DevelopmentRepository
from app.modules.developments.sales_projection_calculator import build_sales_projection_summary
from app.modules.developments.schemas import (
    DevelopmentCostResponse,
    DevelopmentCostsBulkUpdate,
    DevelopmentCostsResponse,
    DevelopmentCostsSummary,
    DevelopmentCreate,
    DevelopmentAnalysisResponse,
    DevelopmentListResponse,
    FinancialDashboardResponse,
    DevelopmentResponse,
    DevelopmentUpdate,
    PaymentScenarioResponse,
    PaymentScenarioUpdate,
    SalesProjectionBulkUpdate,
    SalesProjectionMonthResponse,
    SalesProjectionResponse,
    SalesProjectionSummary,
)
from app.shared.errors.handlers import NotFoundError


class DevelopmentService:
    def __init__(self, db: Session):
        self.repository = DevelopmentRepository(db)

    def _cost_to_response(self, development, cost) -> DevelopmentCostResponse:
        computed = compute_line_total(
            cost,
            estimated_vgv=development.estimated_vgv,
            total_lots=development.total_lots,
            total_area_m2=development.total_area_m2,
        )
        return DevelopmentCostResponse.model_validate(cost).model_copy(update={"computed_total": computed})

    def _costs_summary(self, development) -> DevelopmentCostsSummary:
        totals = summarize_costs(development)
        return DevelopmentCostsSummary(**totals)

    def _to_response(self, development, *, include_costs: bool = True) -> DevelopmentResponse:
        costs = None
        costs_summary = None
        if include_costs and development.costs:
            costs = [self._cost_to_response(development, cost) for cost in development.costs]
            costs_summary = self._costs_summary(development)
        return DevelopmentResponse.model_validate(development).model_copy(
            update={
                "costs": costs or [],
                "costs_summary": costs_summary,
            }
        )

    def create(self, payload: DevelopmentCreate) -> DevelopmentResponse:
        data = payload.model_dump(exclude={"payment_scenarios"}, exclude_unset=True)
        scenarios = None
        if payload.payment_scenarios is not None:
            scenarios = [s.model_dump() for s in payload.payment_scenarios]
        development = self.repository.create(data, scenarios=scenarios)
        return self._to_response(development)

    def list_all(self) -> DevelopmentListResponse:
        items, total = self.repository.list_all()
        return DevelopmentListResponse(
            items=[self._to_response(item, include_costs=False) for item in items],
            total=total,
        )

    def get_by_id(self, development_id: UUID) -> DevelopmentResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_costs(development)
        development = self.repository.ensure_default_sales_projections(development)
        return self._to_response(development)

    def update(self, development_id: UUID, payload: DevelopmentUpdate) -> DevelopmentResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")

        data = payload.model_dump(exclude={"payment_scenarios"}, exclude_unset=True)
        if data:
            self.repository.update(development, data)

        if payload.payment_scenarios is not None:
            scenarios = [s.model_dump() for s in payload.payment_scenarios]
            self.repository.replace_payment_scenarios(development, scenarios)

        refreshed = self.repository.get_by_id(development_id)
        if not refreshed:
            raise NotFoundError("Loteamento não encontrado")
        refreshed = self.repository.ensure_default_costs(refreshed)
        refreshed = self.repository.ensure_default_sales_projections(refreshed)
        return self._to_response(refreshed)

    def delete(self, development_id: UUID) -> None:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        self.repository.delete(development)

    def update_scenario(
        self,
        development_id: UUID,
        scenario_number: int,
        payload: PaymentScenarioUpdate,
    ) -> PaymentScenarioResponse:
        if not self.repository.get_by_id(development_id):
            raise NotFoundError("Loteamento não encontrado")

        data = payload.model_dump(exclude_unset=True)
        scenario = self.repository.update_scenario(development_id, scenario_number, data)
        if not scenario:
            raise NotFoundError("Cenário de pagamento não encontrado")
        return PaymentScenarioResponse.model_validate(scenario)

    def get_costs(self, development_id: UUID) -> DevelopmentCostsResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_costs(development)
        items = [self._cost_to_response(development, cost) for cost in development.costs]
        return DevelopmentCostsResponse(items=items, summary=self._costs_summary(development))

    def update_costs(self, development_id: UUID, payload: DevelopmentCostsBulkUpdate) -> DevelopmentCostsResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_costs(development)
        items = [item.model_dump(exclude_unset=True) for item in payload.items]
        updated = self.repository.update_costs(development, items)
        return DevelopmentCostsResponse(
            items=[self._cost_to_response(updated, cost) for cost in updated.costs],
            summary=self._costs_summary(updated),
        )

    def _sales_projection_response(self, development) -> SalesProjectionResponse:
        built = build_sales_projection_summary(development)
        items = [
            SalesProjectionMonthResponse.model_validate(entry["row"]).model_copy(
                update={
                    "computed_lots": entry["computed_lots"],
                    "cumulative_lots": entry["cumulative_lots"],
                }
            )
            for entry in built["items"]
        ]
        return SalesProjectionResponse(
            items=items,
            summary=SalesProjectionSummary(**built["summary"]),
        )

    def get_sales_projection(self, development_id: UUID) -> SalesProjectionResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_sales_projections(development)
        return self._sales_projection_response(development)

    def update_sales_projection(
        self,
        development_id: UUID,
        payload: SalesProjectionBulkUpdate,
    ) -> SalesProjectionResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_sales_projections(development)
        items = [item.model_dump(exclude_unset=True) for item in payload.items]
        updated = self.repository.update_sales_projection(
            development,
            projection_months=payload.projection_months,
            projection_mode=payload.projection_mode,
            items=items,
        )
        return self._sales_projection_response(updated)

    def get_analysis(self, development_id: UUID, scenario_number: int = 1) -> DevelopmentAnalysisResponse:
        development = self.repository.get_by_id(development_id)
        if not development:
            raise NotFoundError("Loteamento não encontrado")
        development = self.repository.ensure_default_costs(development)
        development = self.repository.ensure_default_sales_projections(development)
        result = run_development_analysis(development, selected_scenario=scenario_number)
        return DevelopmentAnalysisResponse.model_validate(result)

    def get_financial_dashboard(self, scenario_number: int = 1) -> FinancialDashboardResponse:
        items, _total = self.repository.list_all()
        prepared: list = []
        for development in items:
            development = self.repository.ensure_default_costs(development)
            development = self.repository.ensure_default_sales_projections(development)
            prepared.append(development)
        result = build_financial_dashboard(prepared, reference_scenario=scenario_number)
        return FinancialDashboardResponse.model_validate(result)
