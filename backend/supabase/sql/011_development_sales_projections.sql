-- Revision 011 | Revises 010
-- Projeção mensal de vendas (36 meses padrão)

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

CREATE INDEX IF NOT EXISTS ix_development_sales_projections_development_id
    ON development_sales_projections (development_id);

-- 36 meses por loteamento existente
INSERT INTO development_sales_projections (id, development_id, month_number, lots_count, percent_of_total)
SELECT gen_random_uuid(), d.id, m.month_number, 0, 0
FROM developments d
CROSS JOIN generate_series(1, 36) AS m(month_number)
WHERE NOT EXISTS (
    SELECT 1 FROM development_sales_projections p WHERE p.development_id = d.id
);

UPDATE alembic_version SET version_num = '011' WHERE version_num = '010';
