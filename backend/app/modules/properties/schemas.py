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
    property_type: str | None = Field(default="terreno", pattern="^(terreno|lote)$")
    location: str | None = None
    price: Decimal | None = None
    description: str | None = None
    size: Decimal | None = None

    zoning: str | None = Field(default=None, pattern="^(residential|commercial|industrial|rural|mixed)$")
    topography: str | None = Field(default=None, pattern="^(flat|slope_up|slope_down|irregular)$")
    frontage: Decimal | None = Field(default=None, ge=0)
    depth: Decimal | None = Field(default=None, ge=0)
    documentation: str | None = Field(default=None, pattern="^(deed|registration|contract|financing)$")
    gated_community: bool = False
    accepts_financing: bool = False
    has_water: bool = False
    has_electricity: bool = False
    has_sewage: bool = False
    paved_street: bool = False
    development_name: str | None = Field(default=None, max_length=160)
    block: str | None = Field(default=None, max_length=30)
    lot_number: str | None = Field(default=None, max_length=30)


class PropertyCreate(PropertyBase):
    agent_user_id: UUID | None = None


class PropertyUpdate(PropertyBase):
    agent_user_id: UUID | None = None


class PropertyResponse(PropertyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_type: str = "sale"
    property_type: str = "terreno"
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


class AnalyticsDayPoint(BaseModel):
    date: str
    views: int = 0
    whatsapp: int = 0


class AnalyticsPropertyRank(BaseModel):
    id: UUID
    title: str | None
    views_7d: int = 0
    whatsapp_clicks_7d: int = 0


class AnalyticsOverviewResponse(BaseModel):
    totals: PropertyStats
    daily: list[AnalyticsDayPoint]
    top_properties: list[AnalyticsPropertyRank]
    conversion_rate: float | None = None


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
