from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.properties.filters import PropertySearchFilters
from app.modules.properties.models import Property, PropertyImage


class PropertyRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return select(Property).options(selectinload(Property.images))

    def _apply_filters(self, stmt, filters: PropertySearchFilters, *, public_only: bool = False):
        if public_only:
            stmt = stmt.where(Property.agent_whatsapp.isnot(None), Property.agent_whatsapp != "")
        if filters.listing_type:
            stmt = stmt.where(Property.listing_type == filters.listing_type)
        if filters.property_type:
            stmt = stmt.where(Property.property_type == filters.property_type)
        if filters.category == "land":
            stmt = stmt.where(Property.property_type == "land")
        elif filters.category == "residential":
            stmt = stmt.where(Property.property_type.in_(("house", "apartment")))
        if filters.min_price is not None:
            stmt = stmt.where(Property.price >= filters.min_price)
        if filters.max_price is not None:
            stmt = stmt.where(Property.price <= filters.max_price)
        if filters.location:
            term = f"%{filters.location.strip()}%"
            stmt = stmt.where(Property.location.ilike(term))
        if filters.min_rooms is not None:
            stmt = stmt.where(Property.rooms >= filters.min_rooms)
        if filters.min_size is not None:
            stmt = stmt.where(Property.size >= filters.min_size)
        return stmt

    def _apply_sort(self, stmt, sort: str):
        if sort == "price_asc":
            return stmt.order_by(Property.price.asc().nullslast(), Property.created_at.desc())
        if sort == "price_desc":
            return stmt.order_by(Property.price.desc().nullslast(), Property.created_at.desc())
        return stmt.order_by(Property.created_at.desc())

    def create(self, data: dict) -> Property:
        property_ = Property(**data)
        self.db.add(property_)
        self.db.commit()
        self.db.refresh(property_)
        return self.get_by_id(property_.id) or property_

    def get_by_id(self, property_id: UUID) -> Property | None:
        stmt = self._base_query().where(Property.id == property_id)
        return self.db.scalar(stmt)

    def list_paginated(
        self,
        page: int,
        limit: int,
        agent_user_id: UUID | None = None,
        filters: PropertySearchFilters | None = None,
    ) -> tuple[list[Property], int]:
        offset = (page - 1) * limit
        search = filters or PropertySearchFilters()
        public_only = agent_user_id is None

        count_stmt = select(func.count()).select_from(Property)
        stmt = self._base_query()
        stmt = self._apply_filters(stmt, search, public_only=public_only)
        count_stmt = self._apply_filters(count_stmt, search, public_only=public_only)

        if agent_user_id:
            count_stmt = count_stmt.where(Property.agent_user_id == agent_user_id)
            stmt = stmt.where(Property.agent_user_id == agent_user_id)

        stmt = self._apply_sort(stmt, search.sort)

        total = self.db.scalar(count_stmt) or 0
        items = list(self.db.scalars(stmt.offset(offset).limit(limit)).all())
        return items, total

    def update(self, property_: Property, data: dict) -> Property:
        for key, value in data.items():
            setattr(property_, key, value)
        self.db.commit()
        return self.get_by_id(property_.id) or property_

    def delete(self, property_: Property) -> None:
        self.db.delete(property_)
        self.db.commit()

    def add_image(self, property_id: UUID, url: str, sort_order: int) -> PropertyImage:
        image = PropertyImage(property_id=property_id, url=url, sort_order=sort_order)
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def get_image(self, property_id: UUID, image_id: UUID) -> PropertyImage | None:
        stmt = select(PropertyImage).where(
            PropertyImage.id == image_id,
            PropertyImage.property_id == property_id,
        )
        return self.db.scalar(stmt)

    def delete_image(self, image: PropertyImage) -> None:
        self.db.delete(image)
        self.db.commit()

    def next_sort_order(self, property_id: UUID) -> int:
        max_order = self.db.scalar(
            select(func.max(PropertyImage.sort_order)).where(PropertyImage.property_id == property_id)
        )
        return (max_order or -1) + 1

    def list_similar(self, property_id: UUID, limit: int = 3) -> list[Property]:
        base = self.get_by_id(property_id)
        if not base:
            return []

        def _query(*extra_filters) -> list[Property]:
            stmt = self._base_query().where(
                Property.id != property_id,
                Property.agent_whatsapp.isnot(None),
                Property.agent_whatsapp != "",
                Property.listing_type == base.listing_type,
                Property.property_type == base.property_type,
                *extra_filters,
            )
            stmt = stmt.order_by(Property.created_at.desc()).limit(limit)
            return list(self.db.scalars(stmt).all())

        location_hint = (base.location or "").split(",")[0].strip()
        filters = []
        if location_hint:
            filters.append(Property.location.ilike(f"%{location_hint}%"))
        if base.price is not None:
            low = base.price * Decimal("0.7")
            high = base.price * Decimal("1.3")
            filters.append(Property.price >= low)
            filters.append(Property.price <= high)
        if base.rooms is not None:
            filters.append(Property.rooms >= base.rooms)

        items = _query(*filters) if filters else _query()
        if items:
            return items[:limit]

        return _query()[:limit]
