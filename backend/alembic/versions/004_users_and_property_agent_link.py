"""users table and property agent link

Revision ID: 004
Revises: 003
Create Date: 2026-05-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("creci", sa.String(length=30), nullable=True),
        sa.Column("whatsapp", sa.String(length=30), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.add_column("properties", sa.Column("agent_creci", sa.String(length=30), nullable=True))
    op.add_column("properties", sa.Column("agent_user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_properties_agent_user_id",
        "properties",
        "users",
        ["agent_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_properties_agent_user_id", "properties", ["agent_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_properties_agent_user_id", table_name="properties")
    op.drop_constraint("fk_properties_agent_user_id", "properties", type_="foreignkey")
    op.drop_column("properties", "agent_user_id")
    op.drop_column("properties", "agent_creci")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
