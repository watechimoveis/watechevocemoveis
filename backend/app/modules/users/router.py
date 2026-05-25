from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.users.schemas import AgentCreate, AgentUpdate, UserResponse
from app.modules.users.service import UserService
from app.shared.auth.dependencies import get_current_user, require_admin
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db

router = APIRouter(prefix="/agents", tags=["agents"])


def get_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get("", response_model=list[UserResponse])
def list_agents(
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.list_agents()


@router.post("", response_model=UserResponse, status_code=201)
def create_agent(
    payload: AgentCreate,
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.create_agent(payload)


@router.put("/{agent_id}", response_model=UserResponse)
def update_agent(
    agent_id: UUID,
    payload: AgentUpdate,
    _admin: CurrentUser = Depends(require_admin),
    service: UserService = Depends(get_service),
):
    return service.update_agent(agent_id, payload)
