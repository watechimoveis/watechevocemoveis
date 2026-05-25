from app.modules.auth.schemas import LoginRequest, LoginResponse
from app.modules.users.models import UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserResponse
from app.modules.users.service import user_to_response
from app.shared.auth.jwt import create_access_token
from app.shared.auth.security import verify_password
from app.shared.errors.handlers import AppError


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def login(self, payload: LoginRequest) -> LoginResponse:
        user = self.repository.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AppError(code="INVALID_CREDENTIALS", message="E-mail ou senha incorretos", status_code=401)

        if not user.is_active:
            raise AppError(code="USER_INACTIVE", message="Usuário inativo", status_code=403)

        token = create_access_token(user.id, user.role)
        return LoginResponse(access_token=token, user=user_to_response(user))
