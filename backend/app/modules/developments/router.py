from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.modules.developments.schemas import (
    DevelopmentCreate,
    DevelopmentAnalysisResponse,
    DevelopmentCostsBulkUpdate,
    DevelopmentCostsResponse,
    DevelopmentListResponse,
    DevelopmentResponse,
    DevelopmentUpdate,
    FinancialDashboardResponse,
    PaymentScenarioResponse,
    PaymentScenarioUpdate,
    SalesProjectionBulkUpdate,
    SalesProjectionResponse,
)
from app.modules.developments.service import DevelopmentService
from app.shared.auth.dependencies import get_current_user, require_admin_or_financial
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db

router = APIRouter(prefix="/developments", tags=["developments"])


def get_service(db: Session = Depends(get_db)) -> DevelopmentService:
    return DevelopmentService(db)


@router.get("", response_model=DevelopmentListResponse)
def list_developments(
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.list_all()


@router.get("/dashboard", response_model=FinancialDashboardResponse)
def get_financial_dashboard(
    scenario_number: int = Query(default=1, ge=1, le=4),
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.get_financial_dashboard(scenario_number=scenario_number)


@router.post("", response_model=DevelopmentResponse, status_code=201)
def create_development(
    payload: DevelopmentCreate,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.create(payload)


@router.get("/{development_id}", response_model=DevelopmentResponse)
def get_development(
    development_id: UUID,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.get_by_id(development_id)


@router.put("/{development_id}", response_model=DevelopmentResponse)
def update_development(
    development_id: UUID,
    payload: DevelopmentUpdate,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.update(development_id, payload)


@router.delete("/{development_id}", status_code=204, response_class=Response)
def delete_development(
    development_id: UUID,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    service.delete(development_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{development_id}/scenarios/{scenario_number}",
    response_model=PaymentScenarioResponse,
)
def update_payment_scenario(
    development_id: UUID,
    scenario_number: int,
    payload: PaymentScenarioUpdate,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.update_scenario(development_id, scenario_number, payload)


@router.get("/{development_id}/costs", response_model=DevelopmentCostsResponse)
def get_development_costs(
    development_id: UUID,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.get_costs(development_id)


@router.put("/{development_id}/costs", response_model=DevelopmentCostsResponse)
def update_development_costs(
    development_id: UUID,
    payload: DevelopmentCostsBulkUpdate,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.update_costs(development_id, payload)


@router.get("/{development_id}/sales-projection", response_model=SalesProjectionResponse)
def get_sales_projection(
    development_id: UUID,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.get_sales_projection(development_id)


@router.put("/{development_id}/sales-projection", response_model=SalesProjectionResponse)
def update_sales_projection(
    development_id: UUID,
    payload: SalesProjectionBulkUpdate,
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.update_sales_projection(development_id, payload)


@router.get("/{development_id}/analysis", response_model=DevelopmentAnalysisResponse)
def get_development_analysis(
    development_id: UUID,
    scenario_number: int = Query(default=1, ge=1, le=4),
    _user: CurrentUser = Depends(require_admin_or_financial),
    service: DevelopmentService = Depends(get_service),
):
    return service.get_analysis(development_id, scenario_number=scenario_number)
