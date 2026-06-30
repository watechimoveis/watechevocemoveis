from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.developments.models import (
    DEFAULT_DEVELOPMENT_COSTS,
    DEFAULT_PAYMENT_SCENARIOS,
    DEFAULT_SALES_PROJECTION_MONTHS,
    Development,
    DevelopmentCost,
    DevelopmentPaymentScenario,
    DevelopmentSalesProjection,
)


class DevelopmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return select(Development).options(
            selectinload(Development.payment_scenarios),
            selectinload(Development.costs),
            selectinload(Development.sales_projections),
        )

    def _default_costs_data(self) -> list[dict]:
        return [
            {
                "category_code": code,
                "label": label,
                "cost_nature": nature,
                "amount_type": amount_type,
                "amount": 0,
                "sort_order": sort_order,
            }
            for code, label, nature, amount_type, sort_order in DEFAULT_DEVELOPMENT_COSTS
        ]

    def _seed_sales_projections(self, development: Development, months: int | None = None) -> None:
        horizon = months or development.sales_projection_months or DEFAULT_SALES_PROJECTION_MONTHS
        development.sales_projection_months = horizon
        for month in range(1, horizon + 1):
            development.sales_projections.append(
                DevelopmentSalesProjection(
                    month_number=month,
                    lots_count=0,
                    percent_of_total=0,
                )
            )

    def create(self, data: dict, scenarios: list[dict] | None = None) -> Development:
        scenarios_data = scenarios or [
            {
                "scenario_number": num,
                "label": label,
                "down_payment_pct": down,
                "installments": inst,
            }
            for num, label, down, inst in DEFAULT_PAYMENT_SCENARIOS
        ]
        if "sales_projection_months" not in data:
            data["sales_projection_months"] = DEFAULT_SALES_PROJECTION_MONTHS
        if "sales_projection_mode" not in data:
            data["sales_projection_mode"] = "lots"

        development = Development(**data)
        for item in scenarios_data:
            development.payment_scenarios.append(DevelopmentPaymentScenario(**item))
        for item in self._default_costs_data():
            development.costs.append(DevelopmentCost(**item))
        self._seed_sales_projections(development, development.sales_projection_months)
        self.db.add(development)
        self.db.commit()
        return self.get_by_id(development.id) or development

    def get_by_id(self, development_id: UUID) -> Development | None:
        return self.db.scalar(self._base_query().where(Development.id == development_id))

    def list_all(self) -> tuple[list[Development], int]:
        stmt = self._base_query().order_by(Development.created_at.desc())
        items = list(self.db.scalars(stmt).all())
        return items, len(items)

    def update(self, development: Development, data: dict) -> Development:
        for key, value in data.items():
            setattr(development, key, value)
        self.db.commit()
        return self.get_by_id(development.id) or development

    def replace_payment_scenarios(self, development: Development, scenarios: list[dict]) -> Development:
        development.payment_scenarios.clear()
        for item in scenarios:
            development.payment_scenarios.append(DevelopmentPaymentScenario(**item))
        self.db.commit()
        return self.get_by_id(development.id) or development

    def ensure_default_costs(self, development: Development) -> Development:
        if development.costs:
            return development
        for item in self._default_costs_data():
            development.costs.append(DevelopmentCost(**item))
        self.db.commit()
        return self.get_by_id(development.id) or development

    def ensure_default_sales_projections(self, development: Development) -> Development:
        if development.sales_projections:
            return development
        self._seed_sales_projections(development)
        self.db.commit()
        return self.get_by_id(development.id) or development

    def update_costs(self, development: Development, items: list[dict]) -> Development:
        by_code = {cost.category_code: cost for cost in development.costs}
        for item in items:
            code = item["category_code"]
            cost = by_code.get(code)
            if not cost:
                continue
            for key, value in item.items():
                if key == "category_code":
                    continue
                if value is not None:
                    setattr(cost, key, value)
        self.db.commit()
        return self.get_by_id(development.id) or development

    def update_sales_projection(
        self,
        development: Development,
        *,
        projection_months: int | None,
        projection_mode: str | None,
        items: list[dict],
    ) -> Development:
        if projection_mode is not None:
            development.sales_projection_mode = projection_mode

        if projection_months is not None and projection_months != development.sales_projection_months:
            existing = {row.month_number: row for row in development.sales_projections}
            development.sales_projections.clear()
            for month in range(1, projection_months + 1):
                previous = existing.get(month)
                development.sales_projections.append(
                    DevelopmentSalesProjection(
                        month_number=month,
                        lots_count=previous.lots_count if previous else 0,
                        percent_of_total=previous.percent_of_total if previous else 0,
                    )
                )
            development.sales_projection_months = projection_months

        by_month = {row.month_number: row for row in development.sales_projections}
        for item in items:
            row = by_month.get(item["month_number"])
            if not row:
                continue
            if item.get("lots_count") is not None:
                row.lots_count = item["lots_count"]
            if item.get("percent_of_total") is not None:
                row.percent_of_total = item["percent_of_total"]

        self.db.commit()
        return self.get_by_id(development.id) or development

    def delete(self, development: Development) -> None:
        self.db.delete(development)
        self.db.commit()

    def update_scenario(
        self,
        development_id: UUID,
        scenario_number: int,
        data: dict,
    ) -> DevelopmentPaymentScenario | None:
        stmt = select(DevelopmentPaymentScenario).where(
            DevelopmentPaymentScenario.development_id == development_id,
            DevelopmentPaymentScenario.scenario_number == scenario_number,
        )
        scenario = self.db.scalar(stmt)
        if not scenario:
            return None
        for key, value in data.items():
            setattr(scenario, key, value)
        self.db.commit()
        self.db.refresh(scenario)
        return scenario
