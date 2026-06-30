import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base

DEFAULT_PAYMENT_SCENARIOS: list[tuple[int, str, float, int]] = [
    (1, "Cenário 1 — 10% + 120x", 10.0, 120),
    (2, "Cenário 2 — 20% + 80x", 20.0, 80),
    (3, "Cenário 3 — 30% + 60x", 30.0, 60),
    (4, "Cenário 4 — 100% à vista", 100.0, 0),
]

# code, label, cost_nature (fixed|variable), amount_type, sort_order
DEFAULT_DEVELOPMENT_COSTS: list[tuple[str, str, str, str, int]] = [
    ("land_acquisition", "Aquisição do terreno", "fixed", "fixed", 1),
    ("earthworks_infra", "Terraplanagem e infraestrutura", "fixed", "fixed", 2),
    ("projects_licensing", "Projetos, topografia e licenciamento", "fixed", "fixed", 3),
    ("marketing_sales", "Marketing e vendas", "fixed", "fixed", 4),
    ("broker_commission", "Comissão de corretores", "variable", "percent_vgv", 5),
    ("deed_registration", "Escritura, registro e cartório", "variable", "per_lot", 6),
    ("admin_overhead", "Administração e overhead", "fixed", "fixed", 7),
    ("taxes_on_costs", "Impostos sobre custos diretos", "fixed", "percent_vgv", 8),
    ("contingency", "Contingência", "fixed", "percent_vgv", 9),
    ("other", "Outros custos", "fixed", "fixed", 10),
]

DEFAULT_SALES_PROJECTION_MONTHS = 36


class Development(Base):
    """Empreendimento / loteamento — base da viabilidade financeira."""

    __tablename__ = "developments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_lots: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_area_m2: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    sales_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    delivery_forecast_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    estimated_vgv: Mapped[float | None] = mapped_column(Numeric(19, 4), nullable=True)
    default_down_payment_pct: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    default_installments: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unsold_lots_pct: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Taxas mensais em pontos percentuais (ex.: 2.12 = 2,12% a.m.)
    tma_monthly_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    projected_inflation_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    financing_interest_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    iss_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    pis_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    cofins_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    csll_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    irpj_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    sales_projection_months: Mapped[int] = mapped_column(Integer, nullable=False, default=DEFAULT_SALES_PROJECTION_MONTHS)
    sales_projection_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="lots")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    payment_scenarios: Mapped[list["DevelopmentPaymentScenario"]] = relationship(
        back_populates="development",
        cascade="all, delete-orphan",
        order_by="DevelopmentPaymentScenario.scenario_number",
    )
    costs: Mapped[list["DevelopmentCost"]] = relationship(
        back_populates="development",
        cascade="all, delete-orphan",
        order_by="DevelopmentCost.sort_order",
    )
    sales_projections: Mapped[list["DevelopmentSalesProjection"]] = relationship(
        back_populates="development",
        cascade="all, delete-orphan",
        order_by="DevelopmentSalesProjection.month_number",
    )

    __table_args__ = (
        Index("ix_developments_name", "name"),
        Index("ix_developments_created_at", "created_at"),
    )


class DevelopmentPaymentScenario(Base):
    __tablename__ = "development_payment_scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    development_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("developments.id", ondelete="CASCADE"),
        nullable=False,
    )
    scenario_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(80), nullable=True)
    down_payment_pct: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    installments: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    development: Mapped[Development] = relationship(back_populates="payment_scenarios")

    __table_args__ = (
        UniqueConstraint("development_id", "scenario_number", name="uq_development_scenario_number"),
        Index("ix_development_payment_scenarios_development_id", "development_id"),
    )


class DevelopmentCost(Base):
    """Linha de custo do loteamento — categorias padrão de viabilidade."""

    __tablename__ = "development_costs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    development_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("developments.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_code: Mapped[str] = mapped_column(String(40), nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    cost_nature: Mapped[str] = mapped_column(String(20), nullable=False, default="fixed")
    amount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="fixed")
    amount: Mapped[float] = mapped_column(Numeric(19, 4), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    development: Mapped[Development] = relationship(back_populates="costs")

    __table_args__ = (
        UniqueConstraint("development_id", "category_code", name="uq_development_cost_category"),
        Index("ix_development_costs_development_id", "development_id"),
    )


class DevelopmentSalesProjection(Base):
    """Projeção mensal de vendas de lotes."""

    __tablename__ = "development_sales_projections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    development_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("developments.id", ondelete="CASCADE"),
        nullable=False,
    )
    month_number: Mapped[int] = mapped_column(Integer, nullable=False)
    lots_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    percent_of_total: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    development: Mapped[Development] = relationship(back_populates="sales_projections")

    __table_args__ = (
        UniqueConstraint("development_id", "month_number", name="uq_development_sales_projection_month"),
        Index("ix_development_sales_projections_development_id", "development_id"),
    )
