from decimal import Decimal

from app.modules.developments.analysis_engine import run_development_analysis
from app.modules.developments.cost_calculator import summarize_costs
from app.modules.developments.models import Development
from app.modules.developments.sales_projection_calculator import target_sellable_lots

D = Decimal
ZERO = D("0")


def build_financial_dashboard(developments: list[Development], *, reference_scenario: int = 1) -> dict:
    items: list[dict] = []
    total_vgv = ZERO
    total_vpl = ZERO
    complete_studies = 0
    viable_by_vpl = 0
    attractive_by_tir = 0
    tir_values: list[Decimal] = []

    for development in developments:
        analysis = run_development_analysis(development, selected_scenario=reference_scenario)
        scenarios = analysis.get("scenarios") or []
        reference = next(
            (item for item in scenarios if item["scenario_number"] == reference_scenario),
            scenarios[0] if scenarios else None,
        )
        best = max(scenarios, key=lambda item: item["vpl"]) if scenarios else None

        vgv = D(str(development.estimated_vgv or 0))
        total_vgv += vgv

        warnings = analysis.get("warnings") or []
        is_complete = len(warnings) == 0
        if is_complete:
            complete_studies += 1

        if reference:
            total_vpl += reference["vpl"]
            if reference["vpl_viable"]:
                viable_by_vpl += 1
            if reference["tir_attractive"]:
                attractive_by_tir += 1
            if reference["tir_monthly_pct"] is not None:
                tir_values.append(D(str(reference["tir_monthly_pct"])))

        costs = summarize_costs(development)
        sellable = target_sellable_lots(development.total_lots, development.unsold_lots_pct)

        items.append(
            {
                "id": development.id,
                "name": development.name,
                "location": development.location,
                "estimated_vgv": development.estimated_vgv,
                "target_sellable_lots": sellable,
                "total_costs": costs["total"],
                "reference_scenario": reference_scenario,
                "vpl": reference["vpl"] if reference else None,
                "tir_monthly_pct": reference["tir_monthly_pct"] if reference else None,
                "payback_months": reference["payback_months"] if reference else None,
                "break_even_lots": reference["break_even_lots"] if reference else None,
                "vpl_viable": reference["vpl_viable"] if reference else None,
                "tir_attractive": reference["tir_attractive"] if reference else None,
                "best_scenario_number": best["scenario_number"] if best else None,
                "best_vpl": best["vpl"] if best else None,
                "any_scenario_viable": any(item["vpl_viable"] for item in scenarios) if scenarios else False,
                "is_complete": is_complete,
                "warnings_count": len(warnings),
            }
        )

    avg_tir = sum(tir_values) / D(len(tir_values)) if tir_values else None

    return {
        "summary": {
            "total_developments": len(developments),
            "complete_studies": complete_studies,
            "viable_by_vpl": viable_by_vpl,
            "attractive_by_tir": attractive_by_tir,
            "total_vgv": total_vgv,
            "total_vpl": total_vpl,
            "avg_tir_monthly_pct": avg_tir,
            "reference_scenario": reference_scenario,
        },
        "items": items,
    }
