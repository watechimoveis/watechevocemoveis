from decimal import Decimal, ROUND_HALF_UP

from app.modules.developments.models import Development, DevelopmentSalesProjection

SalesProjectionRow = DevelopmentSalesProjection | dict


def target_sellable_lots(total_lots: int | None, unsold_lots_pct: float | Decimal | None) -> int:
    total = total_lots or 0
    unsold = Decimal(str(unsold_lots_pct or 0))
    sellable = Decimal(total) * (Decimal("1") - unsold / Decimal("100"))
    return max(0, int(sellable.to_integral_value(rounding=ROUND_HALF_UP)))


def _row_lots_count(row: SalesProjectionRow) -> int:
    if isinstance(row, dict):
        return max(0, int(row.get("lots_count") or 0))
    return max(0, int(row.lots_count or 0))


def _row_percent(row: SalesProjectionRow) -> Decimal:
    if isinstance(row, dict):
        return Decimal(str(row.get("percent_of_total") or 0))
    return Decimal(str(row.percent_of_total or 0))


def compute_month_lots(
    row: SalesProjectionRow,
    *,
    mode: str,
    target_sellable_lots: int,
) -> int:
    if mode == "percent":
        pct = _row_percent(row)
        value = Decimal(target_sellable_lots) * pct / Decimal("100")
        return max(0, int(value.to_integral_value(rounding=ROUND_HALF_UP)))
    return _row_lots_count(row)


def build_sales_projection_summary(
    development: Development,
    rows: list[DevelopmentSalesProjection] | None = None,
) -> dict:
    projection_rows = rows if rows is not None else list(development.sales_projections)
    mode = development.sales_projection_mode or "lots"
    target = target_sellable_lots(development.total_lots, development.unsold_lots_pct)

    items: list[dict] = []
    cumulative = 0
    total_projected_lots = 0
    total_projected_percent = Decimal("0")

    for row in sorted(projection_rows, key=lambda item: item.month_number):
        computed_lots = compute_month_lots(row, mode=mode, target_sellable_lots=target)
        cumulative += computed_lots
        total_projected_lots += computed_lots
        if mode == "percent":
            total_projected_percent += _row_percent(row)
        items.append(
            {
                "row": row,
                "computed_lots": computed_lots,
                "cumulative_lots": cumulative,
            }
        )

    return {
        "items": items,
        "summary": {
            "target_sellable_lots": target,
            "total_projected_lots": total_projected_lots,
            "total_projected_percent": total_projected_percent,
            "remaining_lots": target - total_projected_lots,
            "projection_months": development.sales_projection_months,
            "projection_mode": mode,
        },
    }
