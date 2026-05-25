from sqlalchemy.orm import Session

from app.config import settings
from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.shared.auth.security import hash_password


def seed_admin_user(db: Session) -> None:
    repository = UserRepository(db)
    existing = repository.get_by_email(settings.admin_email)
    if existing:
        return

    repository.create(
        {
            "email": settings.admin_email.lower(),
            "password_hash": hash_password(settings.admin_password),
            "name": "Administrador",
            "creci": None,
            "whatsapp": None,
            "role": UserRole.ADMIN.value,
            "is_active": True,
        }
    )
