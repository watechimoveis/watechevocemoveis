from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings


def _engine_kwargs() -> dict:
    url = settings.normalized_database_url
    kwargs: dict = {"pool_pre_ping": True}

    connect_args: dict = {}

    # Supabase pooler transacional (porta 6543) não suporta pool persistente
    if ":6543" in url or "pgbouncer=true" in url.lower():
        kwargs["poolclass"] = NullPool
    else:
        kwargs["pool_size"] = 5
        kwargs["max_overflow"] = 10

    if settings.app_env == "production" and "sslmode=" not in url.lower():
        connect_args["sslmode"] = "require"

    if connect_args:
        kwargs["connect_args"] = connect_args

    return kwargs


engine = create_engine(settings.normalized_database_url, **_engine_kwargs())

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def database_connection_error() -> str | None:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return None
    except Exception as exc:
        return str(exc).split("\n")[0][:200]
