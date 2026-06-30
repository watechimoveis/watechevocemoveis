-- Revision 010 | Revises 009
-- Custos por categoria (10 linhas padrão por loteamento)

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

-- Seed categorias padrão para loteamentos já existentes
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
WHERE NOT EXISTS (
    SELECT 1 FROM development_costs c WHERE c.development_id = d.id
);

UPDATE alembic_version SET version_num = '010' WHERE version_num = '009';
