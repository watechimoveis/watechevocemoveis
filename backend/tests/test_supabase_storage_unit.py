import uuid

from app.config import settings
from app.shared.storage import supabase_storage


def test_object_path_format():
    property_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    assert supabase_storage.object_path(property_id, "abc.jpg") == (
        "properties/12345678-1234-5678-1234-567812345678/abc.jpg"
    )


def test_public_url_and_path_roundtrip():
    object_path = "properties/abc/photo.png"
    public = supabase_storage.public_url(object_path)
    assert public.startswith(settings.supabase_url.rstrip("/"))
    assert settings.storage_bucket in public
    assert supabase_storage.path_from_public_url(public) == object_path


def test_path_from_public_url_returns_none_for_local_paths():
    assert supabase_storage.path_from_public_url("/uploads/properties/x/y.jpg") is None
