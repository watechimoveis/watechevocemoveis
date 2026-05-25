from sqlalchemy.orm import Session

from app.config import settings
from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.shared.auth.security import hash_password


def seed_admin_user(db: Session) -> None:
    repository = UserRepository(db)
    email = settings.admin_email.lower()
    existing = repository.get_by_email(email)

    if existing:
        if existing.role != UserRole.ADMIN.value:
            repository.update(existing, {"role": UserRole.ADMIN.value, "name": "Administrador"})
        return

    repository.create(
        {
            "email": email,
            "password_hash": hash_password(settings.admin_password),
            "name": "Administrador",
            "creci": None,
            "whatsapp": None,
            "role": UserRole.ADMIN.value,
            "is_active": True,
        }
    )
