from uuid import UUID

from fastapi import Response, UploadFile, status
from sqlalchemy.orm import Session

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
from app.modules.properties.schemas import AnalyticsOverviewResponse
from app.modules.properties.service import PropertyService
from app.shared.auth.security import CurrentUser


class PropertyController:
    def __init__(self, db: Session):
        self.service = PropertyService(db)

    def create(self, payload: PropertyCreate, user: CurrentUser) -> PropertyResponse:
        return self.service.create(payload, user)

    def list_properties(
        self,
        page: int,
        limit: int,
        user: CurrentUser | None,
        filters: PropertySearchFilters | None = None,
    ) -> PropertyListResponse:
        return self.service.list_properties(page, limit, user, filters)

    def get_by_id(self, property_id: UUID, user: CurrentUser | None = None) -> PropertyResponse:
        return self.service.get_by_id(property_id, user)

    def update(self, property_id: UUID, payload: PropertyUpdate, user: CurrentUser) -> PropertyResponse:
        return self.service.update(property_id, payload, user)

    def delete(self, property_id: UUID, user: CurrentUser) -> Response:
        self.service.delete(property_id, user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    def upload_images(
        self, property_id: UUID, files: list[UploadFile], user: CurrentUser
    ) -> list[PropertyImageResponse]:
        return self.service.upload_images(property_id, files, user)

    def delete_image(self, property_id: UUID, image_id: UUID, user: CurrentUser) -> Response:
        self.service.delete_image(property_id, image_id, user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    def record_event(self, property_id: UUID, payload: PropertyEventCreate) -> PropertyEventResponse:
        return self.service.record_event(property_id, payload)

    def list_similar(self, property_id: UUID) -> list[PropertyResponse]:
        return self.service.list_similar(property_id)

    def get_analytics_overview(self, user: CurrentUser, days: int = 7) -> AnalyticsOverviewResponse:
        return self.service.get_analytics_overview(user, days=days)
