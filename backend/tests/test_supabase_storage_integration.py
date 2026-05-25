import uuid

import pytest

from app.config import settings
from app.shared.storage import supabase_storage

pytestmark = pytest.mark.integration

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture(scope="module", autouse=True)
def skip_without_supabase():
    if not settings.use_supabase_storage:
        pytest.skip("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados")


def test_supabase_upload_public_url_and_delete():
    property_id = uuid.uuid4()
    object_path = supabase_storage.object_path(property_id, "pytest-test.png")

    public_url = supabase_storage.upload_object(object_path, TINY_PNG, "image/png")

    assert public_url.startswith("https://")
    assert settings.storage_bucket in public_url
    assert public_url.endswith("pytest-test.png")
    assert supabase_storage.path_from_public_url(public_url) == object_path

    supabase_storage.delete_objects([object_path])

    remaining = supabase_storage.list_object_paths(f"properties/{property_id}/")
    assert not any("pytest-test.png" in p for p in remaining)
