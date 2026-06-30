# Histórico de migrations — Supabase

Atualize esta tabela sempre que adicionar uma migration nova.

| Rev | Alembic (`.py`) | SQL Supabase | Status |
|-----|-----------------|--------------|--------|
| 001 | `001_create_properties_table.py` | — | Base inicial |
| 002 | `002_create_property_images_table.py` | — | Base inicial |
| 003 | `003_add_agent_name.py` | — | Base inicial |
| 004 | `004_users_and_property_agent_link.py` | — | Base inicial |
| 005 | `005_add_listing_type.py` | — | Base inicial |
| 006 | `006_create_property_events.py` | — | Base inicial |
| 007 | `007_add_property_type.py` | `007_add_property_type.sql` | ✅ |
| 008 | `008_land_only_model.py` | `008_land_only_model.sql` | ✅ |
| 009 | `009_create_developments.py` | `009_create_developments.sql` | ✅ |
| 010 | `010_development_costs.py` | `010_development_costs.sql` | ✅ |
| 011 | `011_development_sales_projections.py` | `011_development_sales_projections.sql` | ✅ |

**Head:** `011`

## Próxima migration (012+)

1. Criar `backend/alembic/versions/012_....py`
2. Criar `backend/supabase/sql/012_....sql`
3. Adicionar linha nesta tabela
4. Aplicar manualmente no Supabase SQL Editor
