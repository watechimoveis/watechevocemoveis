import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    listing_type: Mapped[str] = mapped_column(String(10), nullable=False, default="sale")
    property_type: Mapped[str] = mapped_column(String(20), nullable=False, default="land")
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(19, 4), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rooms: Mapped[int | None] = mapped_column(nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(nullable=True)
    parking: Mapped[int | None] = mapped_column(nullable=True)
    size: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    agent_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    agent_creci: Mapped[str | None] = mapped_column(String(30), nullable=True)
    agent_whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    agent_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    images: Mapped[list["PropertyImage"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyImage.sort_order",
    )

    __table_args__ = (
        Index("ix_properties_created_at", "created_at"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_location", "location"),
        Index("ix_properties_agent_user_id", "agent_user_id"),
        Index("ix_properties_listing_type", "listing_type"),
        Index("ix_properties_listing_price", "listing_type", "price"),
        Index("ix_properties_property_type", "property_type"),
        Index("ix_properties_listing_property_type", "listing_type", "property_type"),
    )


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property: Mapped[Property] = relationship(back_populates="images")

    __table_args__ = (Index("ix_property_images_property_id", "property_id"),)


class PropertyEvent(Base):
    __tablename__ = "property_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    session_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_property_events_property_id", "property_id"),
        Index("ix_property_events_created_at", "created_at"),
        Index("ix_property_events_property_type_created", "property_id", "event_type", "created_at"),
        Index("ix_property_events_dedup_view", "property_id", "event_type", "session_hash", "created_at"),
    )
