"""development costs by category

Revision ID: 010
Revises: 009
Create Date: 2026-06-29
"""

from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_COSTS = [
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


def upgrade() -> None:
    op.create_table(
        "development_costs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("development_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_code", sa.String(length=40), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("cost_nature", sa.String(length=20), nullable=False),
        sa.Column("amount_type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False, server_default="0"),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["development_id"], ["developments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("development_id", "category_code", name="uq_development_cost_category"),
    )
    op.create_index("ix_development_costs_development_id", "development_costs", ["development_id"], unique=False)

    conn = op.get_bind()
    developments = conn.execute(sa.text("SELECT id FROM developments")).fetchall()
    for row in developments:
        development_id = row[0]
        for code, label, nature, amount_type, sort_order in DEFAULT_COSTS:
            conn.execute(
                sa.text(
                    """
                    INSERT INTO development_costs
                    (id, development_id, category_code, label, cost_nature, amount_type, amount, sort_order)
                    VALUES (:id, :development_id, :category_code, :label, :cost_nature, :amount_type, 0, :sort_order)
                    """
                ),
                {
                    "id": str(uuid4()),
                    "development_id": str(development_id),
                    "category_code": code,
                    "label": label,
                    "cost_nature": nature,
                    "amount_type": amount_type,
                    "sort_order": sort_order,
                },
            )


def downgrade() -> None:
    op.drop_index("ix_development_costs_development_id", table_name="development_costs")
    op.drop_table("development_costs")
