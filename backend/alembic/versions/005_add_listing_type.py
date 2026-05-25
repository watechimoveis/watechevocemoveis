"""add listing_type to properties

Revision ID: 005
Revises: 004
Create Date: 2026-05-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column("listing_type", sa.String(length=10), nullable=False, server_default="sale"),
    )
    op.create_index("ix_properties_listing_type", "properties", ["listing_type"], unique=False)
    op.create_index("ix_properties_listing_price", "properties", ["listing_type", "price"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_properties_listing_price", table_name="properties")
    op.drop_index("ix_properties_listing_type", table_name="properties")
    op.drop_column("properties", "listing_type")
