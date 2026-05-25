import logging
import uuid

import httpx

from app.config import settings
from app.shared.errors.handlers import AppError

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return settings.supabase_url.rstrip("/")


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }


def ensure_bucket() -> None:
    """Cria o bucket público se ainda não existir (idempotente)."""
    url = f"{_base_url()}/storage/v1/bucket"
    payload = {
        "id": settings.storage_bucket,
        "name": settings.storage_bucket,
        "public": True,
    }
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                url,
                headers={**_headers(), "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code in (200, 201):
                logger.info("Bucket Supabase '%s' pronto", settings.storage_bucket)
            elif response.status_code == 409 or "already exists" in response.text.lower():
                logger.debug("Bucket Supabase '%s' já existe", settings.storage_bucket)
            else:
                response.raise_for_status()
    except httpx.HTTPError:
        logger.exception(
            "Não foi possível garantir o bucket '%s' — crie manualmente no painel Supabase",
            settings.storage_bucket,
        )


def public_url(object_path: str) -> str:
    return f"{_base_url()}/storage/v1/object/public/{settings.storage_bucket}/{object_path}"


def path_from_public_url(url: str) -> str | None:
    marker = f"/storage/v1/object/public/{settings.storage_bucket}/"
    if marker in url:
        return url.split(marker, 1)[1]
    return None


def upload_object(object_path: str, content: bytes, content_type: str) -> str:
    url = f"{_base_url()}/storage/v1/object/{settings.storage_bucket}/{object_path}"
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                url,
                headers={
                    **_headers(),
                    "Content-Type": content_type,
                    "x-upsert": "false",
                },
                content=content,
            )
            if response.status_code == 400 and "Duplicate" in response.text:
                raise AppError(
                    code="UPLOAD_FAILED",
                    message="Erro ao enviar foto. Tente novamente.",
                    status_code=400,
                )
            response.raise_for_status()
    except AppError:
        raise
    except httpx.HTTPError as exc:
        logger.exception("Falha no upload Supabase Storage: %s", object_path)
        raise AppError(
            code="UPLOAD_FAILED",
            message="Não foi possível salvar a foto no storage.",
            status_code=502,
        ) from exc

    return public_url(object_path)


def delete_objects(object_paths: list[str]) -> None:
    if not object_paths:
        return

    url = f"{_base_url()}/storage/v1/object/{settings.storage_bucket}"
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.request(
                "DELETE",
                url,
                headers={**_headers(), "Content-Type": "application/json"},
                json=object_paths,
            )
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Falha ao remover objetos do Supabase Storage")


def list_object_paths(prefix: str) -> list[str]:
    url = f"{_base_url()}/storage/v1/object/list/{settings.storage_bucket}"
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                url,
                headers={**_headers(), "Content-Type": "application/json"},
                json={"prefix": prefix, "limit": 1000, "offset": 0},
            )
            response.raise_for_status()
            items = response.json()
    except httpx.HTTPError:
        logger.exception("Falha ao listar objetos do Supabase Storage: %s", prefix)
        return []

    paths: list[str] = []
    normalized_prefix = prefix.rstrip("/") + "/" if prefix else ""
    for item in items:
        name = item.get("name")
        if not name or name.endswith("/"):
            continue
        if normalized_prefix and not name.startswith(normalized_prefix):
            path = f"{normalized_prefix}{name.lstrip('/')}"
        else:
            path = name
        paths.append(path)
    return paths


def delete_prefix(prefix: str) -> None:
    paths = list_object_paths(prefix)
    delete_objects(paths)


def object_path(property_id: uuid.UUID, filename: str) -> str:
    return f"properties/{property_id}/{filename}"
