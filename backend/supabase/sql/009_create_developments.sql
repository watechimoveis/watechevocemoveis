-- Revision 009 | Revises 008
-- Loteamentos + cenários de pagamento

CREATE TABLE IF NOT EXISTS developments (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    location VARCHAR(500),
    total_lots INTEGER,
    total_area_m2 NUMERIC(14, 2),
    sales_start_date DATE,
    delivery_forecast_date DATE,
    estimated_vgv NUMERIC(19, 4),
    default_down_payment_pct NUMERIC(6, 2),
    default_installments INTEGER,
    unsold_lots_pct NUMERIC(6, 2),
    tma_monthly_pct NUMERIC(8, 4),
    projected_inflation_pct NUMERIC(8, 4),
    financing_interest_pct NUMERIC(8, 4),
    iss_pct NUMERIC(8, 4),
    pis_pct NUMERIC(8, 4),
    cofins_pct NUMERIC(8, 4),
    csll_pct NUMERIC(8, 4),
    irpj_pct NUMERIC(8, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_developments_name ON developments (name);
CREATE INDEX IF NOT EXISTS ix_developments_created_at ON developments (created_at);

CREATE TABLE IF NOT EXISTS development_payment_scenarios (
    id UUID NOT NULL PRIMARY KEY,
    development_id UUID NOT NULL REFERENCES developments (id) ON DELETE CASCADE,
    scenario_number INTEGER NOT NULL,
    label VARCHAR(80),
    down_payment_pct NUMERIC(6, 2) NOT NULL,
    installments INTEGER NOT NULL,
    CONSTRAINT uq_development_scenario_number UNIQUE (development_id, scenario_number)
);

CREATE INDEX IF NOT EXISTS ix_development_payment_scenarios_development_id
    ON development_payment_scenarios (development_id);

UPDATE alembic_version SET version_num = '009' WHERE version_num = '008';
