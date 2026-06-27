from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PropertySearchFilters:
    property_type: str | None = None
    zoning: str | None = None
    documentation: str | None = None
    gated_community: bool | None = None
    accepts_financing: bool | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    location: str | None = None
    min_size: int | None = None
    max_size: int | None = None
    sort: str = "recent"
