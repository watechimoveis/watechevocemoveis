"""add property_type to properties

Revision ID: 007
Revises: 006
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column("property_type", sa.String(length=20), nullable=False, server_default="land"),
    )
    op.create_index("ix_properties_property_type", "properties", ["property_type"], unique=False)
    op.create_index(
        "ix_properties_listing_property_type",
        "properties",
        ["listing_type", "property_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_properties_listing_property_type", table_name="properties")
    op.drop_index("ix_properties_property_type", table_name="properties")
    op.drop_column("properties", "property_type")
