from dataclasses import dataclass
from uuid import UUID

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


@dataclass
class CurrentUser:
    id: UUID
    email: str
    name: str
    creci: str | None
    whatsapp: str | None
    role: str
    is_active: bool

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_agent(self) -> bool:
        return self.role == "agent"

    @property
    def is_financial(self) -> bool:
        return self.role == "financial"

    @property
    def can_access_financial(self) -> bool:
        return self.is_admin or self.is_financial
