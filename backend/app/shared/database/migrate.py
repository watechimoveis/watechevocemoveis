"""Executa migrations Alembic na subida da API (produção Render)."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parents[3]


def run_migrations() -> None:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    command.upgrade(cfg, "head")
    logger.info("Migrations Alembic aplicadas com sucesso")
