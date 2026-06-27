from decimal import Decimal

from app.modules.properties.filters import PropertySearchFilters
from app.modules.properties.repository import PropertyRepository


def test_apply_filters_land_attributes():
    filters = PropertySearchFilters(
        property_type="lote",
        zoning="residential",
        gated_community=True,
        location="Centro",
        min_size=300,
        max_size=1000,
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

    assert "property_type" in sql
    assert "zoning" in sql
    assert "gated_community" in sql
    assert "location" in sql or "ilike" in sql
    assert "size" in sql
    assert "price" in sql
