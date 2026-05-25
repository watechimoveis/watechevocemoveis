from decimal import Decimal

from app.modules.properties.filters import PropertySearchFilters
from app.modules.properties.repository import PropertyRepository


def test_apply_filters_location_min_rooms_min_size():
    filters = PropertySearchFilters(
        listing_type="sale",
        location="Centro",
        min_rooms=2,
        min_size=60,
        min_price=Decimal("100000"),
        max_price=Decimal("500000"),
    )

    repo = PropertyRepository.__new__(PropertyRepository)
    stmt = repo._apply_filters(
        PropertyRepository._base_query(repo),
        filters,
        public_only=True,
    )
    sql = str(stmt.compile(compile_kwargs={"literal_binds": True})).lower()

    assert "listing_type" in sql or "sale" in sql
    assert "location" in sql or "ilike" in sql
    assert "rooms" in sql
    assert "size" in sql
    assert "price" in sql
