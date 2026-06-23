import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


def _cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin and origin in settings.cors_origin_list:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


def register_exception_handlers(app):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "message": exc.message, "details": exc.details},
            headers=_cors_headers(request),
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        logger.exception("Erro não tratado: %s", exc)
        if app.debug:
            return JSONResponse(
                status_code=500,
                content={"code": "INTERNAL_ERROR", "message": str(exc), "details": {}},
                headers=_cors_headers(request),
            )
        return JSONResponse(
            status_code=500,
            content={"code": "INTERNAL_ERROR", "message": "Erro interno do servidor", "details": {}},
            headers=_cors_headers(request),
        )
