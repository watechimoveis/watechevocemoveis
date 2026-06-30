-- Revision NNN | Revises MMM
-- Descrição curta do que esta migration faz
--
-- Antes de rodar no Supabase:
--   SELECT version_num FROM alembic_version;
-- Execute somente se version_num = 'MMM'

-- ========== UPGRADE ==========

-- (DDL/DML aqui — preferir IF NOT EXISTS / IF EXISTS)

-- Exemplo:
-- ALTER TABLE minha_tabela ADD COLUMN IF NOT EXISTS novo_campo VARCHAR(50);

-- ========== ALEMBIC VERSION ==========

UPDATE alembic_version SET version_num = 'NNN' WHERE version_num = 'MMM';

-- ========== CONFERÊNCIA ==========
-- SELECT version_num FROM alembic_version;
