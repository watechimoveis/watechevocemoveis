from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PropertySearchFilters:
    listing_type: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    sort: str = "recent"
