from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import AgentCreate, AgentUpdate, UserResponse
from app.shared.auth.security import hash_password
from app.shared.errors.handlers import AppError


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        creci=user.creci,
        whatsapp=user.whatsapp,
        role=user.role,
        is_active=user.is_active,
    )


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def list_agents(self) -> list[UserResponse]:
        return [user_to_response(u) for u in self.repository.list_agents()]

    def create_agent(self, payload: AgentCreate) -> UserResponse:
        if self.repository.get_by_email(payload.email):
            raise AppError(code="EMAIL_EXISTS", message="E-mail já cadastrado", status_code=409)

        user = self.repository.create(
            {
                "email": payload.email.lower(),
                "password_hash": hash_password(payload.password),
                "name": payload.name.strip(),
                "creci": payload.creci.strip() if payload.creci else None,
                "whatsapp": _digits(payload.whatsapp),
                "role": UserRole.AGENT.value,
                "is_active": True,
            }
        )
        return user_to_response(user)

    def update_agent(self, agent_id: UUID, payload: AgentUpdate) -> UserResponse:
        user = self.repository.get_by_id(agent_id)
        if not user or user.role != UserRole.AGENT.value:
            raise AppError(code="NOT_FOUND", message="Corretor não encontrado", status_code=404)

        data: dict = {}
        if payload.email is not None:
            existing = self.repository.get_by_email(payload.email)
            if existing and existing.id != user.id:
                raise AppError(code="EMAIL_EXISTS", message="E-mail já cadastrado", status_code=409)
            data["email"] = payload.email.lower()
        if payload.name is not None:
            data["name"] = payload.name.strip()
        if payload.creci is not None:
            data["creci"] = payload.creci.strip() or None
        if payload.whatsapp is not None:
            data["whatsapp"] = _digits(payload.whatsapp)
        if payload.is_active is not None:
            data["is_active"] = payload.is_active
        if payload.password:
            data["password_hash"] = hash_password(payload.password)

        updated = self.repository.update(user, data)
        return user_to_response(updated)


def _digits(value: str | None) -> str | None:
    if not value:
        return None
    digits = "".join(c for c in value if c.isdigit())
    return digits or None
