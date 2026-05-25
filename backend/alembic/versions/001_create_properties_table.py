"""create properties table

Revision ID: 001
Revises:
Create Date: 2026-05-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=500), nullable=True),
        sa.Column("price", sa.Numeric(precision=19, scale=4), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("parking", sa.Integer(), nullable=True),
        sa.Column("size", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("agent_whatsapp", sa.String(length=30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_created_at", "properties", ["created_at"], unique=False)
    op.create_index("ix_properties_price", "properties", ["price"], unique=False)
    op.create_index("ix_properties_location", "properties", ["location"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_properties_location", table_name="properties")
    op.drop_index("ix_properties_price", table_name="properties")
    op.drop_index("ix_properties_created_at", table_name="properties")
    op.drop_table("properties")
