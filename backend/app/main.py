from contextlib import asynccontextmanager
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.properties.router import router as properties_router
from app.modules.users.router import router as agents_router
from app.shared.database.seed import seed_admin_user
from app.shared.database.session import SessionLocal
from app.shared.errors.handlers import register_exception_handlers
from app.shared.storage import supabase_storage


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.use_supabase_storage:
        supabase_storage.ensure_bucket()
        logger.info("Storage de fotos: Supabase (%s)", settings.storage_bucket)
    else:
        logger.info("Storage de fotos: disco local (%s)", settings.upload_dir)

    db = SessionLocal()
    try:
        seed_admin_user(db)
    except Exception:
        logger.exception("Falha ao criar usuário admin inicial — a API continua sem seed")
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="W.A.Techevoceimoveis API",
        description="API simples para gestão de imóveis",
        version="1.0.0",
        debug=settings.app_env == "development",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(agents_router, prefix=settings.api_prefix)
    app.include_router(properties_router, prefix=settings.api_prefix)

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "storage": "supabase" if settings.use_supabase_storage else "local",
        }

    return app


app = create_app()
