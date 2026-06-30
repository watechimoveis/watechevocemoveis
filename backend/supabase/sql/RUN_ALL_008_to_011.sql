-- Execute se alembic_version = '006' OU se property_type não existir
-- Depois confira: SELECT version_num FROM alembic_version;

-- ========== 007 (se necessário) ==========
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(20) NOT NULL DEFAULT 'land';
CREATE INDEX IF NOT EXISTS ix_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS ix_properties_listing_property_type ON properties (listing_type, property_type);

-- ========== 008 ==========
UPDATE properties SET property_type = 'terreno'
WHERE property_type IS NULL OR property_type NOT IN ('terreno', 'lote');
UPDATE properties SET listing_type = 'sale' WHERE listing_type <> 'sale';
ALTER TABLE properties ALTER COLUMN property_type SET DEFAULT 'terreno';
ALTER TABLE properties DROP COLUMN IF EXISTS rooms;
ALTER TABLE properties DROP COLUMN IF EXISTS bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS parking;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS topography VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS frontage NUMERIC(8, 2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS depth NUMERIC(8, 2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documentation VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gated_community BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS accepts_financing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_water BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_electricity BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_sewage BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS paved_street BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS development_name VARCHAR(160);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS block VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_number VARCHAR(30);
CREATE INDEX IF NOT EXISTS ix_properties_zoning ON properties (zoning);
CREATE INDEX IF NOT EXISTS ix_properties_gated_community ON properties (gated_community);
UPDATE alembic_version SET version_num = '008' WHERE version_num IN ('006', '007');

-- ========== 009 ==========
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
CREATE INDEX IF NOT EXISTS ix_development_payment_scenarios_development_id ON development_payment_scenarios (development_id);
UPDATE alembic_version SET version_num = '009' WHERE version_num = '008';

-- ========== 010 ==========
CREATE TABLE IF NOT EXISTS development_costs (
    id UUID NOT NULL PRIMARY KEY,
    development_id UUID NOT NULL REFERENCES developments (id) ON DELETE CASCADE,
    category_code VARCHAR(40) NOT NULL,
    label VARCHAR(120) NOT NULL,
    cost_nature VARCHAR(20) NOT NULL,
    amount_type VARCHAR(20) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    notes VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_development_cost_category UNIQUE (development_id, category_code)
);
CREATE INDEX IF NOT EXISTS ix_development_costs_development_id ON development_costs (development_id);
INSERT INTO development_costs (id, development_id, category_code, label, cost_nature, amount_type, amount, sort_order)
SELECT gen_random_uuid(), d.id, v.code, v.label, v.nature, v.amount_type, 0, v.sort_order
FROM developments d
CROSS JOIN (
    VALUES
        ('land_acquisition', 'Aquisição do terreno', 'fixed', 'fixed', 1),
        ('earthworks_infra', 'Terraplanagem e infraestrutura', 'fixed', 'fixed', 2),
        ('projects_licensing', 'Projetos, topografia e licenciamento', 'fixed', 'fixed', 3),
        ('marketing_sales', 'Marketing e vendas', 'fixed', 'fixed', 4),
        ('broker_commission', 'Comissão de corretores', 'variable', 'percent_vgv', 5),
        ('deed_registration', 'Escritura, registro e cartório', 'variable', 'per_lot', 6),
        ('admin_overhead', 'Administração e overhead', 'fixed', 'fixed', 7),
        ('taxes_on_costs', 'Impostos sobre custos diretos', 'fixed', 'percent_vgv', 8),
        ('contingency', 'Contingência', 'fixed', 'percent_vgv', 9),
        ('other', 'Outros custos', 'fixed', 'fixed', 10)
) AS v(code, label, nature, amount_type, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM development_costs c WHERE c.development_id = d.id);
UPDATE alembic_version SET version_num = '010' WHERE version_num = '009';

-- ========== 011 ==========
ALTER TABLE developments ADD COLUMN IF NOT EXISTS sales_projection_months INTEGER NOT NULL DEFAULT 36;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS sales_projection_mode VARCHAR(20) NOT NULL DEFAULT 'lots';
CREATE TABLE IF NOT EXISTS development_sales_projections (
    id UUID NOT NULL PRIMARY KEY,
    development_id UUID NOT NULL REFERENCES developments (id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    lots_count INTEGER NOT NULL DEFAULT 0,
    percent_of_total NUMERIC(8, 4),
    CONSTRAINT uq_development_sales_projection_month UNIQUE (development_id, month_number)
);
CREATE INDEX IF NOT EXISTS ix_development_sales_projections_development_id ON development_sales_projections (development_id);
INSERT INTO development_sales_projections (id, development_id, month_number, lots_count, percent_of_total)
SELECT gen_random_uuid(), d.id, m.month_number, 0, 0
FROM developments d
CROSS JOIN generate_series(1, 36) AS m(month_number)
WHERE NOT EXISTS (SELECT 1 FROM development_sales_projections p WHERE p.development_id = d.id);
UPDATE alembic_version SET version_num = '011' WHERE version_num = '010';
