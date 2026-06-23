from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PropertySearchFilters:
    listing_type: str | None = None
    property_type: str | None = None
    category: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    location: str | None = None
    min_rooms: int | None = None
    min_size: int | None = None
    sort: str = "recent"
