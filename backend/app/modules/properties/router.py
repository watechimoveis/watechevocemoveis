from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.modules.properties.controller import PropertyController
from app.modules.properties.filters import PropertySearchFilters
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyEventCreate,
    PropertyEventResponse,
    PropertyImageResponse,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdate,
)
from app.shared.auth.dependencies import get_current_user, get_optional_user
from app.shared.auth.security import CurrentUser
from app.shared.database.session import get_db

router = APIRouter(prefix="/properties", tags=["properties"])


def get_controller(db: Session = Depends(get_db)) -> PropertyController:
    return PropertyController(db)


@router.post("", response_model=PropertyResponse, status_code=201)
def create_property(
    payload: PropertyCreate,
    user: CurrentUser = Depends(get_current_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.create(payload, user)


@router.get("", response_model=PropertyListResponse)
def list_properties(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    listing_type: str | None = Query(default=None, pattern="^(sale|rent)$"),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort: str = Query(default="recent", pattern="^(recent|price_asc|price_desc)$"),
    user: CurrentUser | None = Depends(get_optional_user),
    controller: PropertyController = Depends(get_controller),
):
    filters = PropertySearchFilters(
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
    )
    return controller.list_properties(page, limit, user, filters)


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: UUID,
    user: CurrentUser | None = Depends(get_optional_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.get_by_id(property_id, user)


@router.post("/{property_id}/events", response_model=PropertyEventResponse, status_code=201)
def record_property_event(
    property_id: UUID,
    payload: PropertyEventCreate,
    controller: PropertyController = Depends(get_controller),
):
    return controller.record_event(property_id, payload)


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    user: CurrentUser = Depends(get_current_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.update(property_id, payload, user)


@router.delete("/{property_id}", status_code=204, response_class=Response)
def delete_property(
    property_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.delete(property_id, user)


@router.post("/{property_id}/images", response_model=list[PropertyImageResponse], status_code=201)
def upload_property_images(
    property_id: UUID,
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.upload_images(property_id, files, user)


@router.delete("/{property_id}/images/{image_id}", status_code=204, response_class=Response)
def delete_property_image(
    property_id: UUID,
    image_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    controller: PropertyController = Depends(get_controller),
):
    return controller.delete_image(property_id, image_id, user)
