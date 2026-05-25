from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.properties.models import PropertyEvent

EVENT_VIEW = "view"
EVENT_WHATSAPP_CLICK = "whatsapp_click"
VIEW_DEDUP_HOURS = 24


class PropertyAnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def property_exists(self, property_id: UUID) -> bool:
        from app.modules.properties.models import Property

        return self.db.scalar(select(Property.id).where(Property.id == property_id)) is not None

    def has_recent_view(self, property_id: UUID, session_hash: str, since: datetime) -> bool:
        stmt = (
            select(PropertyEvent.id)
            .where(
                PropertyEvent.property_id == property_id,
                PropertyEvent.event_type == EVENT_VIEW,
                PropertyEvent.session_hash == session_hash,
                PropertyEvent.created_at >= since,
            )
            .limit(1)
        )
        return self.db.scalar(stmt) is not None

    def record_event(self, property_id: UUID, event_type: str, session_hash: str) -> bool:
        if event_type == EVENT_VIEW:
            since = datetime.now(timezone.utc) - timedelta(hours=VIEW_DEDUP_HOURS)
            if self.has_recent_view(property_id, session_hash, since):
                return False

        event = PropertyEvent(
            property_id=property_id,
            event_type=event_type,
            session_hash=session_hash,
        )
        self.db.add(event)
        self.db.commit()
        return True

    def get_stats_for_properties(self, property_ids: list[UUID]) -> dict[UUID, dict[str, int]]:
        if not property_ids:
            return {}

        now = datetime.now(timezone.utc)
        since_7d = now - timedelta(days=7)
        since_30d = now - timedelta(days=30)

        views_7d = self._count_unique_views(property_ids, since_7d)
        views_30d = self._count_unique_views(property_ids, since_30d)
        whatsapp_7d = self._count_clicks(property_ids, since_7d)
        whatsapp_30d = self._count_clicks(property_ids, since_30d)

        stats: dict[UUID, dict[str, int]] = {}
        for pid in property_ids:
            stats[pid] = {
                "views_7d": views_7d.get(pid, 0),
                "views_30d": views_30d.get(pid, 0),
                "whatsapp_clicks_7d": whatsapp_7d.get(pid, 0),
                "whatsapp_clicks_30d": whatsapp_30d.get(pid, 0),
            }
        return stats

    def _count_unique_views(self, property_ids: list[UUID], since: datetime) -> dict[UUID, int]:
        stmt = (
            select(
                PropertyEvent.property_id,
                func.count(func.distinct(PropertyEvent.session_hash)),
            )
            .where(
                PropertyEvent.property_id.in_(property_ids),
                PropertyEvent.event_type == EVENT_VIEW,
                PropertyEvent.created_at >= since,
            )
            .group_by(PropertyEvent.property_id)
        )
        return {row[0]: int(row[1]) for row in self.db.execute(stmt).all()}

    def _count_clicks(self, property_ids: list[UUID], since: datetime) -> dict[UUID, int]:
        stmt = (
            select(PropertyEvent.property_id, func.count())
            .where(
                PropertyEvent.property_id.in_(property_ids),
                PropertyEvent.event_type == EVENT_WHATSAPP_CLICK,
                PropertyEvent.created_at >= since,
            )
            .group_by(PropertyEvent.property_id)
        )
        return {row[0]: int(row[1]) for row in self.db.execute(stmt).all()}
