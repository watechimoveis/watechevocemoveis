"""create developments and payment scenarios

Revision ID: 009
Revises: 008
Create Date: 2026-06-29
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "developments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("location", sa.String(length=500), nullable=True),
        sa.Column("total_lots", sa.Integer(), nullable=True),
        sa.Column("total_area_m2", sa.Numeric(14, 2), nullable=True),
        sa.Column("sales_start_date", sa.Date(), nullable=True),
        sa.Column("delivery_forecast_date", sa.Date(), nullable=True),
        sa.Column("estimated_vgv", sa.Numeric(19, 4), nullable=True),
        sa.Column("default_down_payment_pct", sa.Numeric(6, 2), nullable=True),
        sa.Column("default_installments", sa.Integer(), nullable=True),
        sa.Column("unsold_lots_pct", sa.Numeric(6, 2), nullable=True),
        sa.Column("tma_monthly_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("projected_inflation_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("financing_interest_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("iss_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("pis_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("cofins_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("csll_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("irpj_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_developments_name", "developments", ["name"], unique=False)
    op.create_index("ix_developments_created_at", "developments", ["created_at"], unique=False)

    op.create_table(
        "development_payment_scenarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("development_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scenario_number", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=80), nullable=True),
        sa.Column("down_payment_pct", sa.Numeric(6, 2), nullable=False),
        sa.Column("installments", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["development_id"], ["developments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("development_id", "scenario_number", name="uq_development_scenario_number"),
    )
    op.create_index(
        "ix_development_payment_scenarios_development_id",
        "development_payment_scenarios",
        ["development_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_development_payment_scenarios_development_id", table_name="development_payment_scenarios")
    op.drop_table("development_payment_scenarios")
    op.drop_index("ix_developments_created_at", table_name="developments")
    op.drop_index("ix_developments_name", table_name="developments")
    op.drop_table("developments")
