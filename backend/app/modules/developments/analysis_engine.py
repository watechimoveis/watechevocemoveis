from decimal import Decimal, ROUND_HALF_UP

from app.modules.developments.cost_calculator import summarize_costs
from app.modules.developments.models import Development, DevelopmentPaymentScenario
from app.modules.developments.sales_projection_calculator import (
    build_sales_projection_summary,
    target_sellable_lots,
)

D = Decimal
ZERO = D("0")
ONE = D("1")
HUNDRED = D("100")


def _d(value) -> Decimal:
    return D(str(value or 0))


def total_tax_rate_pct(development: Development) -> Decimal:
    return sum(
        _d(getattr(development, field))
        for field in ("iss_pct", "pis_pct", "cofins_pct", "csll_pct", "irpj_pct")
    )


def lot_price(development: Development, sellable_lots: int) -> Decimal:
    if sellable_lots <= 0:
        return ZERO
    return _d(development.estimated_vgv) / D(sellable_lots)


def unit_variable_cost(variable_costs_total: Decimal, sellable_lots: int) -> Decimal:
    if sellable_lots <= 0:
        return ZERO
    return variable_costs_total / D(sellable_lots)


def unit_contribution_margin(
    price: Decimal,
    unit_variable: Decimal,
    tax_rate_pct: Decimal,
) -> Decimal:
    tax_per_lot = price * tax_rate_pct / HUNDRED
    return price - unit_variable - tax_per_lot


def break_even_lots(fixed_costs: Decimal, unit_margin: Decimal) -> int | None:
    if unit_margin <= 0:
        return None
    lots = fixed_costs / unit_margin
    return max(0, int(lots.to_integral_value(rounding=ROUND_HALF_UP)))


def monthly_lots_series(development: Development) -> list[int]:
    built = build_sales_projection_summary(development)
    return [entry["computed_lots"] for entry in built["items"]]


def build_cash_flows(
    *,
    fixed_costs: Decimal,
    variable_unit_cost: Decimal,
    lot_price_value: Decimal,
    tax_rate_pct: Decimal,
    month_lots: list[int],
    down_payment_pct: Decimal,
    installments: int,
) -> list[Decimal]:
    max_installments = max(installments, 0)
    horizon = len(month_lots) + max_installments + 1
    flows = [ZERO] * (horizon + 1)
    flows[0] = -fixed_costs

    down_rate = down_payment_pct / HUNDRED
    net_factor = ONE - tax_rate_pct / HUNDRED

    for index, lots in enumerate(month_lots):
        month = index + 1
        if lots <= 0:
            continue

        gross = lot_price_value * D(lots)
        down_gross = gross * down_rate
        balance_gross = gross - down_gross

        flows[month] += down_gross * net_factor
        flows[month] -= variable_unit_cost * D(lots)

        if max_installments <= 0:
            flows[month] += balance_gross * net_factor
        else:
            installment_net = (balance_gross / D(max_installments)) * net_factor
            for offset in range(1, max_installments + 1):
                target_month = month + offset
                if target_month < len(flows):
                    flows[target_month] += installment_net

    return flows


def npv(monthly_rate: Decimal, cash_flows: list[Decimal]) -> Decimal:
    total = ZERO
    base = ONE + monthly_rate
    for period, cash_flow in enumerate(cash_flows):
        total += cash_flow / (base**period)
    return total


def compute_vpl(tma_monthly_pct: Decimal, cash_flows: list[Decimal]) -> Decimal:
    rate = tma_monthly_pct / HUNDRED
    return npv(rate, cash_flows)


def compute_tir_monthly_pct(cash_flows: list[Decimal]) -> Decimal | None:
    if len(cash_flows) < 2:
        return None
    if cash_flows[0] >= 0:
        return None
    if not any(cf > 0 for cf in cash_flows[1:]):
        return None
    if npv(ZERO, cash_flows) <= 0:
        return None

    low = ZERO
    high = D("3")

    while npv(high, cash_flows) > 0 and high < D("20"):
        high *= 2
    if npv(high, cash_flows) > 0:
        return None

    for _ in range(120):
        mid = (low + high) / 2
        if npv(mid, cash_flows) > 0:
            low = mid
        else:
            high = mid
    return low * HUNDRED


def compute_payback_months(cash_flows: list[Decimal]) -> int | None:
    cumulative = ZERO
    for period, cash_flow in enumerate(cash_flows):
        cumulative += cash_flow
        if period > 0 and cumulative >= 0:
            return period
    return None


def build_monthly_cash_flow_rows(cash_flows: list[Decimal], tma_monthly_pct: Decimal) -> list[dict]:
    rate = tma_monthly_pct / HUNDRED
    cumulative = ZERO
    cumulative_vpl = ZERO
    rows: list[dict] = []

    for period, cash_flow in enumerate(cash_flows):
        inflows = cash_flow if cash_flow > 0 else ZERO
        outflows = -cash_flow if cash_flow < 0 else ZERO
        cumulative += cash_flow
        discounted = cash_flow / ((ONE + rate) ** period)
        cumulative_vpl += discounted
        rows.append(
            {
                "month_number": period,
                "inflows": inflows,
                "outflows": outflows,
                "net_cash_flow": cash_flow,
                "cumulative_cash_flow": cumulative,
                "discounted_net": discounted,
                "cumulative_vpl": cumulative_vpl,
            }
        )
    return rows


def analyze_scenario(
    *,
    development: Development,
    scenario: DevelopmentPaymentScenario,
    fixed_costs: Decimal,
    variable_costs_total: Decimal,
    sellable_lots: int,
    price: Decimal,
    unit_variable: Decimal,
    unit_margin: Decimal,
    tax_rate_pct: Decimal,
    tma_monthly_pct: Decimal,
    month_lots: list[int],
) -> dict:
    flows = build_cash_flows(
        fixed_costs=fixed_costs,
        variable_unit_cost=unit_variable,
        lot_price_value=price,
        tax_rate_pct=tax_rate_pct,
        month_lots=month_lots,
        down_payment_pct=_d(scenario.down_payment_pct),
        installments=int(scenario.installments or 0),
    )

    vpl = compute_vpl(tma_monthly_pct, flows)
    tir = compute_tir_monthly_pct(flows)
    payback = compute_payback_months(flows)
    break_even = break_even_lots(fixed_costs, unit_margin)

    return {
        "scenario_number": scenario.scenario_number,
        "scenario_label": scenario.label,
        "down_payment_pct": _d(scenario.down_payment_pct),
        "installments": int(scenario.installments or 0),
        "vpl": vpl,
        "tir_monthly_pct": tir,
        "payback_months": payback,
        "break_even_lots": break_even,
        "vpl_viable": vpl > 0,
        "tir_attractive": tir is not None and tir > tma_monthly_pct,
        "total_inflows": sum(cf for cf in flows if cf > 0),
        "total_outflows": sum(-cf for cf in flows if cf < 0),
        "cash_flows": flows,
    }


def run_development_analysis(
    development: Development,
    *,
    selected_scenario: int = 1,
) -> dict:
    warnings: list[str] = []
    sellable = target_sellable_lots(development.total_lots, development.unsold_lots_pct)

    if not development.estimated_vgv:
        warnings.append("Informe o VGV estimado na aba Geral.")
    if not development.total_lots:
        warnings.append("Informe o total de lotes na aba Geral.")
    if development.tma_monthly_pct is None:
        warnings.append("Informe a TMA mensal na aba Geral.")

    costs = summarize_costs(development)
    fixed_costs = costs["fixed_total"]
    variable_costs_total = costs["variable_total"]
    tax_rate = total_tax_rate_pct(development)
    price = lot_price(development, sellable)
    unit_variable = unit_variable_cost(variable_costs_total, sellable)
    unit_margin = unit_contribution_margin(price, unit_variable, tax_rate)
    tma = _d(development.tma_monthly_pct)

    month_lots = monthly_lots_series(development)
    if not any(month_lots):
        warnings.append("Preencha a projeção mensal de vendas na aba Projeção.")

    if not development.payment_scenarios:
        warnings.append("Configure os cenários de pagamento na aba Geral.")

    scenarios = sorted(development.payment_scenarios, key=lambda item: item.scenario_number)
    scenario_results = [
        analyze_scenario(
            development=development,
            scenario=scenario,
            fixed_costs=fixed_costs,
            variable_costs_total=variable_costs_total,
            sellable_lots=sellable,
            price=price,
            unit_variable=unit_variable,
            unit_margin=unit_margin,
            tax_rate_pct=tax_rate,
            tma_monthly_pct=tma,
            month_lots=month_lots,
        )
        for scenario in scenarios
    ]

    selected = next(
        (item for item in scenario_results if item["scenario_number"] == selected_scenario),
        scenario_results[0] if scenario_results else None,
    )

    monthly_rows: list[dict] = []
    if selected:
        monthly_rows = build_monthly_cash_flow_rows(selected["cash_flows"], tma)

    return {
        "development_id": development.id,
        "selected_scenario": selected["scenario_number"] if selected else selected_scenario,
        "tma_monthly_pct": tma,
        "target_sellable_lots": sellable,
        "lot_price": price,
        "fixed_costs": fixed_costs,
        "variable_costs_total": variable_costs_total,
        "unit_variable_cost": unit_variable,
        "unit_contribution_margin": unit_margin,
        "total_tax_rate_pct": tax_rate,
        "warnings": warnings,
        "scenarios": [
            {key: value for key, value in item.items() if key != "cash_flows"} for item in scenario_results
        ],
        "monthly_cash_flows": monthly_rows,
    }
