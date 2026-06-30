from decimal import Decimal

from app.modules.developments.models import Development, DevelopmentCost

CostLine = DevelopmentCost | dict


def _line_amount(line: CostLine) -> Decimal:
    if isinstance(line, dict):
        return Decimal(str(line.get("amount", 0) or 0))
    return Decimal(str(line.amount or 0))


def _line_amount_type(line: CostLine) -> str:
    if isinstance(line, dict):
        return str(line.get("amount_type", "fixed"))
    return line.amount_type


def _line_nature(line: CostLine) -> str:
    if isinstance(line, dict):
        return str(line.get("cost_nature", "fixed"))
    return line.cost_nature


def compute_line_total(
    line: CostLine,
    *,
    estimated_vgv: Decimal | float | None,
    total_lots: int | None,
    total_area_m2: Decimal | float | None,
) -> Decimal:
    amount = _line_amount(line)
    amount_type = _line_amount_type(line)
    vgv = Decimal(str(estimated_vgv or 0))
    lots = Decimal(str(total_lots or 0))
    area = Decimal(str(total_area_m2 or 0))

    if amount_type == "fixed":
        return amount
    if amount_type == "per_lot":
        return amount * lots
    if amount_type == "per_m2":
        return amount * area
    if amount_type == "percent_vgv":
        return amount / Decimal("100") * vgv
    return Decimal("0")


def summarize_costs(
    development: Development,
    costs: list[DevelopmentCost] | None = None,
) -> dict[str, Decimal]:
    lines = costs if costs is not None else list(development.costs)
    total = Decimal("0")
    fixed_total = Decimal("0")
    variable_total = Decimal("0")

    for line in lines:
        line_total = compute_line_total(
            line,
            estimated_vgv=development.estimated_vgv,
            total_lots=development.total_lots,
            total_area_m2=development.total_area_m2,
        )
        total += line_total
        if _line_nature(line) == "variable":
            variable_total += line_total
        else:
            fixed_total += line_total

    return {
        "total": total,
        "fixed_total": fixed_total,
        "variable_total": variable_total,
    }
