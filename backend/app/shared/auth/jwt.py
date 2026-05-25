from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from app.config import settings


def create_access_token(user_id: UUID, role: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> tuple[UUID, str] | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        sub = payload.get("sub")
        role = payload.get("role")
        if not isinstance(sub, str) or not isinstance(role, str):
            return None
        return UUID(sub), role
    except (jwt.PyJWTError, ValueError):
        return None
