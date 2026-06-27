"""restrict properties to land/lot and add land-specific fields

Revision ID: 008
Revises: 007
Create Date: 2026-06-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Normaliza dados existentes para o domínio de terrenos/lotes.
    op.execute(
        "UPDATE properties SET property_type = 'terreno' "
        "WHERE property_type IS NULL OR property_type NOT IN ('terreno', 'lote')"
    )
    op.execute("UPDATE properties SET listing_type = 'sale' WHERE listing_type <> 'sale'")

    # 2. Default do tipo passa a ser 'terreno'.
    op.alter_column("properties", "property_type", server_default="terreno")

    # 3. Remove campos exclusivos de imóvel residencial.
    op.drop_column("properties", "rooms")
    op.drop_column("properties", "bathrooms")
    op.drop_column("properties", "parking")

    # 4. Adiciona campos específicos de terreno/lote.
    op.add_column("properties", sa.Column("zoning", sa.String(length=20), nullable=True))
    op.add_column("properties", sa.Column("topography", sa.String(length=20), nullable=True))
    op.add_column("properties", sa.Column("frontage", sa.Numeric(8, 2), nullable=True))
    op.add_column("properties", sa.Column("depth", sa.Numeric(8, 2), nullable=True))
    op.add_column("properties", sa.Column("documentation", sa.String(length=20), nullable=True))
    op.add_column(
        "properties",
        sa.Column("gated_community", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("accepts_financing", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("has_water", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("has_electricity", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("has_sewage", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("paved_street", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("properties", sa.Column("development_name", sa.String(length=160), nullable=True))
    op.add_column("properties", sa.Column("block", sa.String(length=30), nullable=True))
    op.add_column("properties", sa.Column("lot_number", sa.String(length=30), nullable=True))

    op.create_index("ix_properties_zoning", "properties", ["zoning"], unique=False)
    op.create_index("ix_properties_gated_community", "properties", ["gated_community"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_properties_gated_community", table_name="properties")
    op.drop_index("ix_properties_zoning", table_name="properties")

    op.drop_column("properties", "lot_number")
    op.drop_column("properties", "block")
    op.drop_column("properties", "development_name")
    op.drop_column("properties", "paved_street")
    op.drop_column("properties", "has_sewage")
    op.drop_column("properties", "has_electricity")
    op.drop_column("properties", "has_water")
    op.drop_column("properties", "accepts_financing")
    op.drop_column("properties", "gated_community")
    op.drop_column("properties", "documentation")
    op.drop_column("properties", "depth")
    op.drop_column("properties", "frontage")
    op.drop_column("properties", "topography")
    op.drop_column("properties", "zoning")

    op.add_column("properties", sa.Column("rooms", sa.Integer(), nullable=True))
    op.add_column("properties", sa.Column("bathrooms", sa.Integer(), nullable=True))
    op.add_column("properties", sa.Column("parking", sa.Integer(), nullable=True))

    op.alter_column("properties", "property_type", server_default="land")
