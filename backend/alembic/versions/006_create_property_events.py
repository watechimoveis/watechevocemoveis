"""create property_events table

Revision ID: 006
Revises: 005
Create Date: 2026-05-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "property_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(length=20), nullable=False),
        sa.Column("session_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_property_events_property_id", "property_events", ["property_id"], unique=False)
    op.create_index("ix_property_events_created_at", "property_events", ["created_at"], unique=False)
    op.create_index(
        "ix_property_events_property_type_created",
        "property_events",
        ["property_id", "event_type", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_property_events_dedup_view",
        "property_events",
        ["property_id", "event_type", "session_hash", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_property_events_dedup_view", table_name="property_events")
    op.drop_index("ix_property_events_property_type_created", table_name="property_events")
    op.drop_index("ix_property_events_created_at", table_name="property_events")
    op.drop_index("ix_property_events_property_id", table_name="property_events")
    op.drop_table("property_events")
