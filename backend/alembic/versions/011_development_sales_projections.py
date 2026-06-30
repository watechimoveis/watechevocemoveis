"""development sales projections

Revision ID: 011
Revises: 010
Create Date: 2026-06-29
"""

from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_MONTHS = 36


def upgrade() -> None:
    op.add_column(
        "developments",
        sa.Column("sales_projection_months", sa.Integer(), nullable=False, server_default="36"),
    )
    op.add_column(
        "developments",
        sa.Column("sales_projection_mode", sa.String(length=20), nullable=False, server_default="lots"),
    )

    op.create_table(
        "development_sales_projections",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("development_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("month_number", sa.Integer(), nullable=False),
        sa.Column("lots_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("percent_of_total", sa.Numeric(8, 4), nullable=True),
        sa.ForeignKeyConstraint(["development_id"], ["developments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("development_id", "month_number", name="uq_development_sales_projection_month"),
    )
    op.create_index(
        "ix_development_sales_projections_development_id",
        "development_sales_projections",
        ["development_id"],
        unique=False,
    )

    conn = op.get_bind()
    developments = conn.execute(sa.text("SELECT id FROM developments")).fetchall()
    for row in developments:
        development_id = row[0]
        for month in range(1, DEFAULT_MONTHS + 1):
            conn.execute(
                sa.text(
                    """
                    INSERT INTO development_sales_projections
                    (id, development_id, month_number, lots_count, percent_of_total)
                    VALUES (:id, :development_id, :month_number, 0, 0)
                    """
                ),
                {
                    "id": str(uuid4()),
                    "development_id": str(development_id),
                    "month_number": month,
                },
            )

    op.alter_column("developments", "sales_projection_months", server_default=None)
    op.alter_column("developments", "sales_projection_mode", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_development_sales_projections_development_id", table_name="development_sales_projections")
    op.drop_table("development_sales_projections")
    op.drop_column("developments", "sales_projection_mode")
    op.drop_column("developments", "sales_projection_months")
