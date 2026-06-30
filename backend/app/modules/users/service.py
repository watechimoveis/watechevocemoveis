from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import AgentCreate, AgentUpdate, StaffCreate, StaffUpdate, UserResponse, WhatsAppUpdate
from app.shared.auth.security import CurrentUser, hash_password
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

    def list_staff(self) -> list[UserResponse]:
        return [user_to_response(u) for u in self.repository.list_staff()]

    def create_agent(self, payload: AgentCreate) -> UserResponse:
        return self.create_staff(
            StaffCreate(
                email=payload.email,
                password=payload.password,
                name=payload.name,
                role=UserRole.AGENT.value,
                creci=payload.creci,
                whatsapp=payload.whatsapp,
            )
        )

    def create_staff(self, payload: StaffCreate) -> UserResponse:
        if self.repository.get_by_email(payload.email):
            raise AppError(code="EMAIL_EXISTS", message="E-mail já cadastrado", status_code=409)

        role = payload.role
        if role == UserRole.AGENT.value and not payload.whatsapp:
            raise AppError(
                code="WHATSAPP_REQUIRED",
                message="Corretores precisam de WhatsApp para publicar anúncios",
                status_code=400,
            )

        user = self.repository.create(
            {
                "email": payload.email.lower(),
                "password_hash": hash_password(payload.password),
                "name": payload.name.strip(),
                "creci": payload.creci.strip() if payload.creci and role == UserRole.AGENT.value else None,
                "whatsapp": _normalize_whatsapp(payload.whatsapp) if role == UserRole.AGENT.value else None,
                "role": role,
                "is_active": True,
            }
        )
        return user_to_response(user)

    def update_agent(self, agent_id: UUID, payload: AgentUpdate) -> UserResponse:
        user = self.repository.get_by_id(agent_id)
        if not user or user.role != UserRole.AGENT.value:
            raise AppError(code="NOT_FOUND", message="Corretor não encontrado", status_code=404)
        return self._update_staff_user(user, payload)

    def update_staff(self, staff_id: UUID, payload: StaffUpdate) -> UserResponse:
        user = self.repository.get_by_id(staff_id)
        if not user or user.role not in (UserRole.AGENT.value, UserRole.FINANCIAL.value):
            raise AppError(code="NOT_FOUND", message="Usuário não encontrado", status_code=404)

        if payload.role and payload.role != user.role:
            if payload.role == UserRole.AGENT.value:
                whatsapp = payload.whatsapp if payload.whatsapp is not None else user.whatsapp
                if not whatsapp:
                    raise AppError(
                        code="WHATSAPP_REQUIRED",
                        message="Corretores precisam de WhatsApp para publicar anúncios",
                        status_code=400,
                    )
            user = self.repository.update(user, {"role": payload.role})

        return self._update_staff_user(user, payload)

    def _update_staff_user(self, user: User, payload: AgentUpdate | StaffUpdate) -> UserResponse:
        data: dict = {}
        if payload.email is not None:
            existing = self.repository.get_by_email(payload.email)
            if existing and existing.id != user.id:
                raise AppError(code="EMAIL_EXISTS", message="E-mail já cadastrado", status_code=409)
            data["email"] = payload.email.lower()
        if payload.name is not None:
            data["name"] = payload.name.strip()
        if user.role == UserRole.AGENT.value:
            if payload.creci is not None:
                data["creci"] = payload.creci.strip() or None
            if payload.whatsapp is not None:
                data["whatsapp"] = _normalize_whatsapp(payload.whatsapp)
        if payload.is_active is not None:
            data["is_active"] = payload.is_active
        if payload.password:
            data["password_hash"] = hash_password(payload.password)

        updated = self.repository.update(user, data)

        if user.role == UserRole.AGENT.value and payload.whatsapp is not None:
            from app.modules.properties.repository import PropertyRepository

            PropertyRepository(self.repository.db).sync_agent_whatsapp(user.id, data.get("whatsapp"))

        return user_to_response(updated)

    def update_my_whatsapp(self, user: CurrentUser, payload: WhatsAppUpdate) -> UserResponse:
        if not user.is_agent:
            raise AppError(
                code="FORBIDDEN",
                message="Apenas corretores podem alterar o WhatsApp pelo painel",
                status_code=403,
            )

        db_user = self.repository.get_by_id(user.id)
        if not db_user:
            raise AppError(code="NOT_FOUND", message="Usuário não encontrado", status_code=404)

        digits = _normalize_whatsapp(payload.whatsapp)
        if not digits or len(digits) < 12:
            raise AppError(
                code="INVALID_WHATSAPP",
                message="Informe um WhatsApp válido com DDD e número (ex: 22 99999-9999)",
                status_code=400,
            )

        updated = self.repository.update(db_user, {"whatsapp": digits})

        from app.modules.properties.repository import PropertyRepository

        PropertyRepository(self.repository.db).sync_agent_whatsapp(user.id, digits)

        return user_to_response(updated)


def _digits(value: str | None) -> str | None:
    if not value:
        return None
    digits = "".join(c for c in value if c.isdigit())
    return digits or None


def _normalize_whatsapp(value: str | None) -> str | None:
    digits = _digits(value)
    if not digits:
        return None
    if len(digits) in (10, 11) and not digits.startswith("55"):
        digits = f"55{digits}"
    return digits
