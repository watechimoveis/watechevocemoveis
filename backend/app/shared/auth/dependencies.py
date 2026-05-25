from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.modules.users.repository import UserRepository
from app.shared.auth.jwt import decode_access_token
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db
from app.shared.errors.handlers import AppError

security = HTTPBearer(auto_error=False)


def _to_current_user(user) -> CurrentUser:
    return CurrentUser(
        id=user.id,
        email=user.email,
        name=user.name,
        creci=user.creci,
        whatsapp=user.whatsapp,
        role=user.role,
        is_active=user.is_active,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise AppError(code="UNAUTHORIZED", message="Autenticação necessária", status_code=401)

    decoded = decode_access_token(credentials.credentials)
    if not decoded:
        raise AppError(code="UNAUTHORIZED", message="Token inválido ou expirado", status_code=401)

    user_id, _role = decoded
    user = UserRepository(db).get_by_id(user_id)
    if not user or not user.is_active:
        raise AppError(code="UNAUTHORIZED", message="Usuário inativo ou não encontrado", status_code=401)

    return _to_current_user(user)


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not user.is_admin:
        raise AppError(code="FORBIDDEN", message="Acesso restrito ao administrador", status_code=403)
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser | None:
    if not credentials or credentials.scheme.lower() != "bearer":
        return None

    decoded = decode_access_token(credentials.credentials)
    if not decoded:
        return None

    user_id, _role = decoded
    user = UserRepository(db).get_by_id(user_id)
    if not user or not user.is_active:
        return None

    return _to_current_user(user)
