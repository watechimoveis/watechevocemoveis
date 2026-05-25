from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth.schemas import LoginRequest, LoginResponse
from app.modules.auth.service import AuthService
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserResponse
from app.shared.auth.dependencies import get_current_user
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    return service.login(payload)


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.modules.users.service import user_to_response

    db_user = UserRepository(db).get_by_id(user.id)
    return user_to_response(db_user)
