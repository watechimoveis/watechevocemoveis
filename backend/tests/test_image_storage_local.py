import uuid
from io import BytesIO

import pytest
from fastapi import UploadFile

from app.config import settings
from app.shared.errors.handlers import AppError
from app.shared.storage import image_storage


def _upload_file(content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        file=BytesIO(content),
        filename="photo.png",
        headers={"content-type": content_type},
    )


TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def local_storage(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "supabase_url", "")
    monkeypatch.setattr(settings, "supabase_service_role_key", "")
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    return tmp_path


def test_save_and_delete_local_image(local_storage):
    property_id = uuid.uuid4()
    url = image_storage.save_property_image(property_id, _upload_file(TINY_PNG, "image/png"))

    assert url.startswith(f"/uploads/properties/{property_id}/")
    assert url.endswith(".png")
    assert (local_storage / "properties" / str(property_id)).exists()

    image_storage.delete_image_file(url)
    assert not any((local_storage / "properties" / str(property_id)).iterdir())


def test_rejects_invalid_content_type(local_storage):
    with pytest.raises(AppError) as exc:
        image_storage.save_property_image(uuid.uuid4(), _upload_file(b"not-an-image", "text/plain"))
    assert exc.value.code == "INVALID_FILE_TYPE"


def test_rejects_oversized_file(local_storage, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 0)
    tiny = b"x"
    with pytest.raises(AppError) as exc:
        image_storage.save_property_image(uuid.uuid4(), _upload_file(tiny, "image/png"))
    assert exc.value.code == "FILE_TOO_LARGE"


def test_delete_property_images_removes_folder(local_storage):
    property_id = uuid.uuid4()
    image_storage.save_property_image(property_id, _upload_file(TINY_PNG, "image/png"))
    target = local_storage / "properties" / str(property_id)
    assert target.is_dir()

    image_storage.delete_property_images(property_id)
    assert not target.exists()
