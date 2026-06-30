-- Diagnóstico: rode no SQL Editor do Supabase antes das migrations

SELECT version_num AS alembic_version FROM alembic_version;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
ORDER BY ordinal_position;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
