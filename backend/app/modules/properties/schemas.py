from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PropertyImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    sort_order: int


class PropertyStats(BaseModel):
    views_7d: int = 0
    views_30d: int = 0
    whatsapp_clicks_7d: int = 0
    whatsapp_clicks_30d: int = 0


class PropertyEventCreate(BaseModel):
    event_type: str = Field(pattern="^(view|whatsapp_click)$")
    session_hash: str = Field(min_length=8, max_length=64)


class PropertyEventResponse(BaseModel):
    recorded: bool


class PropertyBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str | None = None
    listing_type: str | None = "sale"
    property_type: str | None = "land"
    location: str | None = None
    price: Decimal | None = None
    description: str | None = None
    rooms: int | None = None
    bathrooms: int | None = None
    parking: int | None = None
    size: Decimal | None = None


class PropertyCreate(PropertyBase):
    agent_user_id: UUID | None = None


class PropertyUpdate(PropertyBase):
    agent_user_id: UUID | None = None


class PropertyResponse(PropertyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_type: str = "sale"
    property_type: str = "land"
    agent_user_id: UUID | None = None
    agent_name: str | None = None
    agent_creci: str | None = None
    agent_whatsapp: str | None = None
    created_at: datetime
    updated_at: datetime
    images: list[PropertyImageResponse] = Field(default_factory=list)
    stats: PropertyStats = Field(default_factory=PropertyStats)


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
