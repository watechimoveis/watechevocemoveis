import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.shared.errors.handlers import AppError
from app.shared.storage import supabase_storage

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def property_upload_dir(property_id: uuid.UUID) -> Path:
    return Path(settings.upload_dir) / "properties" / str(property_id)


def _read_and_validate(file: UploadFile) -> tuple[bytes, str, str]:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise AppError(
            code="INVALID_FILE_TYPE",
            message="Formato inválido. Use JPG, PNG ou WebP.",
            status_code=400,
        )

    content = file.file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise AppError(
            code="FILE_TOO_LARGE",
            message=f"Arquivo muito grande. Máximo: {settings.max_upload_mb}MB.",
            status_code=400,
        )

    extension = ALLOWED_CONTENT_TYPES[content_type]
    return content, content_type, extension


def save_property_image(property_id: uuid.UUID, file: UploadFile) -> str:
    content, content_type, extension = _read_and_validate(file)
    filename = f"{uuid.uuid4()}{extension}"

    if settings.use_supabase_storage:
        object_path = supabase_storage.object_path(property_id, filename)
        return supabase_storage.upload_object(object_path, content, content_type)

    target_dir = property_upload_dir(property_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    target_path.write_bytes(content)
    return f"/uploads/properties/{property_id}/{filename}"


def delete_image_file(url: str) -> None:
    if settings.use_supabase_storage:
        object_path = supabase_storage.path_from_public_url(url)
        if object_path:
            supabase_storage.delete_objects([object_path])
        return

    if not url.startswith("/uploads/"):
        return
    relative = url.removeprefix("/uploads/")
    file_path = Path(settings.upload_dir) / relative
    if file_path.is_file():
        file_path.unlink()


def delete_property_images(property_id: uuid.UUID) -> None:
    if settings.use_supabase_storage:
        supabase_storage.delete_prefix(f"properties/{property_id}/")
        return

    target_dir = property_upload_dir(property_id)
    if not target_dir.exists():
        return
    for file_path in target_dir.iterdir():
        if file_path.is_file():
            file_path.unlink()
    target_dir.rmdir()
