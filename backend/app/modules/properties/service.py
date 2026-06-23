import math
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.modules.properties.analytics_repository import PropertyAnalyticsRepository
from app.modules.properties.filters import PropertySearchFilters
from app.modules.properties.repository import PropertyRepository
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyEventCreate,
    PropertyEventResponse,
    PropertyImageResponse,
    PropertyListResponse,
    PropertyResponse,
    PropertyStats,
    PropertyUpdate,
)
from app.modules.users.models import UserRole
from app.modules.users.repository import UserRepository
from app.shared.auth.security import CurrentUser
from app.shared.errors.handlers import AppError, NotFoundError
from app.shared.storage.image_storage import (
    delete_image_file,
    delete_property_images,
    save_property_image,
)


class PropertyService:
    def __init__(self, db: Session):
        self.repository = PropertyRepository(db)
        self.analytics = PropertyAnalyticsRepository(db)
        self.users = UserRepository(db)

    def _to_response(self, property_, stats: PropertyStats | None = None) -> PropertyResponse:
        data = PropertyResponse.model_validate(property_)
        if stats is not None:
            data.stats = stats
        return data

    def _attach_stats(
        self,
        properties: list,
        *,
        full: bool,
    ) -> list[PropertyResponse]:
        if not properties:
            return []

        ids = [p.id for p in properties]
        raw = self.analytics.get_stats_for_properties(ids)

        responses: list[PropertyResponse] = []
        for prop in properties:
            s = raw.get(prop.id, {})
            if full:
                stats = PropertyStats(
                    views_7d=s.get("views_7d", 0),
                    views_30d=s.get("views_30d", 0),
                    whatsapp_clicks_7d=s.get("whatsapp_clicks_7d", 0),
                    whatsapp_clicks_30d=s.get("whatsapp_clicks_30d", 0),
                )
            else:
                stats = PropertyStats(views_7d=s.get("views_7d", 0))
            responses.append(self._to_response(prop, stats))
        return responses

    def _ensure_can_modify(self, property_, user: CurrentUser) -> None:
        if user.is_admin:
            return
        if property_.agent_user_id != user.id:
            raise AppError(
                code="FORBIDDEN",
                message="Você só pode editar imóveis cadastrados por você",
                status_code=403,
            )

    def _apply_agent_snapshot(self, data: dict, agent) -> dict:
        data["agent_user_id"] = agent.id
        data["agent_name"] = agent.name
        data["agent_creci"] = agent.creci
        data["agent_whatsapp"] = agent.whatsapp
        return data

    def _resolve_agent_for_create(self, payload: PropertyCreate, user: CurrentUser):
        if user.is_agent:
            agent = self.users.get_by_id(user.id)
            if not agent or not agent.whatsapp:
                raise AppError(
                    code="INCOMPLETE_PROFILE",
                    message="Complete seu WhatsApp no perfil antes de cadastrar imóveis",
                    status_code=400,
                )
            return agent

        if not payload.agent_user_id:
            raise AppError(
                code="AGENT_REQUIRED",
                message="Selecione o corretor responsável pelo imóvel",
                status_code=400,
            )

        if payload.agent_user_id:
            agent = self.users.get_by_id(payload.agent_user_id)
            if not agent or agent.role != UserRole.AGENT.value or not agent.is_active:
                raise AppError(code="INVALID_AGENT", message="Corretor inválido", status_code=400)
            if not agent.whatsapp:
                raise AppError(
                    code="INCOMPLETE_AGENT",
                    message="O corretor precisa ter WhatsApp cadastrado para publicar imóveis",
                    status_code=400,
                )
            return agent

        return None

    def _resolve_agent_for_update(self, agent_user_id: UUID | None, user: CurrentUser):
        if not user.is_admin or not agent_user_id:
            return None
        agent = self.users.get_by_id(agent_user_id)
        if not agent or agent.role != UserRole.AGENT.value or not agent.is_active:
            raise AppError(code="INVALID_AGENT", message="Corretor inválido", status_code=400)
        if not agent.whatsapp:
            raise AppError(
                code="INCOMPLETE_AGENT",
                message="O corretor precisa ter WhatsApp cadastrado",
                status_code=400,
            )
        return agent

    def create(self, payload: PropertyCreate, user: CurrentUser) -> PropertyResponse:
        data = payload.model_dump(exclude_unset=True, exclude={"agent_user_id"})
        agent = self._resolve_agent_for_create(payload, user)
        if agent:
            data = self._apply_agent_snapshot(data, agent)

        property_ = self.repository.create(data)
        return self._to_response(property_, PropertyStats())

    def list_properties(
        self,
        page: int,
        limit: int,
        user: CurrentUser | None,
        filters: PropertySearchFilters | None = None,
    ) -> PropertyListResponse:
        agent_filter = user.id if user and user.is_agent else None
        items, total = self.repository.list_paginated(
            page, limit, agent_user_id=agent_filter, filters=filters
        )
        pages = math.ceil(total / limit) if total > 0 else 0
        include_stats = user is not None

        if include_stats:
            items_response = self._attach_stats(items, full=True)
        else:
            items_response = [self._to_response(item) for item in items]

        return PropertyListResponse(
            items=items_response,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    def get_by_id(self, property_id: UUID, user: CurrentUser | None = None) -> PropertyResponse:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")
        if user and user.is_agent and property_.agent_user_id != user.id:
            raise AppError(code="FORBIDDEN", message="Acesso negado", status_code=403)

        if user:
            responses = self._attach_stats([property_], full=True)
            return responses[0]

        responses = self._attach_stats([property_], full=False)
        return responses[0]

    def update(self, property_id: UUID, payload: PropertyUpdate, user: CurrentUser) -> PropertyResponse:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")

        self._ensure_can_modify(property_, user)

        data = payload.model_dump(exclude_unset=True, exclude={"agent_user_id"})

        if user.is_admin and payload.agent_user_id is not None:
            agent = self._resolve_agent_for_update(payload.agent_user_id, user)
            if agent:
                data = self._apply_agent_snapshot(data, agent)

        updated = self.repository.update(property_, data)
        responses = self._attach_stats([updated], full=True)
        return responses[0]

    def delete(self, property_id: UUID, user: CurrentUser) -> None:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")
        self._ensure_can_modify(property_, user)
        self.repository.delete(property_)
        delete_property_images(property_id)

    def upload_images(self, property_id: UUID, files: list[UploadFile], user: CurrentUser) -> list[PropertyImageResponse]:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")
        self._ensure_can_modify(property_, user)

        uploaded: list[PropertyImageResponse] = []
        for file in files:
            url = save_property_image(property_id, file)
            sort_order = self.repository.next_sort_order(property_id)
            image = self.repository.add_image(property_id, url, sort_order)
            uploaded.append(PropertyImageResponse.model_validate(image))

        return uploaded

    def delete_image(self, property_id: UUID, image_id: UUID, user: CurrentUser) -> None:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")
        self._ensure_can_modify(property_, user)

        image = self.repository.get_image(property_id, image_id)
        if not image:
            raise NotFoundError("Imagem não encontrada")
        delete_image_file(image.url)
        self.repository.delete_image(image)

    def record_event(self, property_id: UUID, payload: PropertyEventCreate) -> PropertyEventResponse:
        if not self.analytics.property_exists(property_id):
            raise NotFoundError("Imóvel não encontrado")

        recorded = self.analytics.record_event(property_id, payload.event_type, payload.session_hash)
        return PropertyEventResponse(recorded=recorded)

    def list_similar(self, property_id: UUID) -> list[PropertyResponse]:
        property_ = self.repository.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Imóvel não encontrado")
        if not property_.agent_whatsapp:
            raise NotFoundError("Imóvel não encontrado")

        items = self.repository.list_similar(property_id, limit=3)
        return [self._to_response(item) for item in items]

    def get_analytics_overview(self, user: CurrentUser, days: int = 7):
        from app.modules.properties.schemas import (
            AnalyticsDayPoint,
            AnalyticsOverviewResponse,
            AnalyticsPropertyRank,
        )

        agent_filter = user.id if user.is_agent else None
        property_ids = self.repository.list_ids(agent_user_id=agent_filter)

        if not property_ids:
            empty = PropertyStats()
            return AnalyticsOverviewResponse(
                totals=empty,
                daily=[],
                top_properties=[],
                conversion_rate=None,
            )

        raw_stats = self.analytics.get_stats_for_properties(property_ids)
        totals = PropertyStats(
            views_7d=sum(s.get("views_7d", 0) for s in raw_stats.values()),
            views_30d=sum(s.get("views_30d", 0) for s in raw_stats.values()),
            whatsapp_clicks_7d=sum(s.get("whatsapp_clicks_7d", 0) for s in raw_stats.values()),
            whatsapp_clicks_30d=sum(s.get("whatsapp_clicks_30d", 0) for s in raw_stats.values()),
        )

        daily_raw = self.analytics.get_daily_series(property_ids, days=days)
        daily = [AnalyticsDayPoint.model_validate(row) for row in daily_raw]

        ranked: list[AnalyticsPropertyRank] = []
        for pid in property_ids:
            prop = self.repository.get_by_id(pid)
            if not prop:
                continue
            s = raw_stats.get(pid, {})
            ranked.append(
                AnalyticsPropertyRank(
                    id=pid,
                    title=prop.title,
                    views_7d=s.get("views_7d", 0),
                    whatsapp_clicks_7d=s.get("whatsapp_clicks_7d", 0),
                )
            )
        ranked.sort(key=lambda r: (r.whatsapp_clicks_7d, r.views_7d), reverse=True)
        top = ranked[:5]

        conversion = None
        if totals.views_7d > 0:
            conversion = round((totals.whatsapp_clicks_7d / totals.views_7d) * 100, 1)

        return AnalyticsOverviewResponse(
            totals=totals,
            daily=daily,
            top_properties=top,
            conversion_rate=conversion,
        )
