from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.users.schemas import StaffCreate, StaffUpdate, UserResponse
from app.modules.users.service import UserService
from app.shared.auth.dependencies import require_admin
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db

router = APIRouter(prefix="/staff", tags=["staff"])


def get_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get("", response_model=list[UserResponse])
def list_staff(
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.list_staff()


@router.post("", response_model=UserResponse, status_code=201)
def create_staff(
    payload: StaffCreate,
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.create_staff(payload)


@router.put("/{staff_id}", response_model=UserResponse)
def update_staff(
    staff_id: UUID,
    payload: StaffUpdate,
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.update_staff(staff_id, payload)
