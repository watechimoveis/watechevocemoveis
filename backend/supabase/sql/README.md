# Migrations — Supabase manual

Este projeto usa **Alembic** no código (`backend/alembic/versions/`) e **SQL manual** no Supabase (`backend/supabase/sql/`).

## Regra do projeto

> **Toda migration nova deve ter um `.sql` correspondente em `backend/supabase/sql/`**  
> Você aplica manualmente no **SQL Editor** do Supabase. Não rode `alembic upgrade` em produção.

---

## Ao criar uma migration nova

1. Criar o `.py` em `backend/alembic/versions/` (como hoje).
2. **Criar o `.sql` espelho** em `backend/supabase/sql/`:
   - Nome: `NNN_descricao_curta.sql` (mesmo número da revision).
   - Usar `_TEMPLATE.sql` como base.
3. SQL **idempotente** quando possível:
   - `ADD COLUMN IF NOT EXISTS`
   - `CREATE TABLE IF NOT EXISTS`
   - `DROP COLUMN IF EXISTS`
4. **Sempre** terminar com:
   ```sql
   UPDATE alembic_version SET version_num = 'NNN' WHERE version_num = 'MMM';
   ```
   (`MMM` = revision anterior)
5. Atualizar **`MANIFEST.md`** (tabela abaixo).
6. Se a migration tiver lógica Python (loops, seed), reescrever em SQL puro (`INSERT … SELECT`, `generate_series`, etc.) — **não** colar o `.py` no Supabase.

---

## Antes de executar no Supabase

```sql
-- Cole em: backend/supabase/sql/000_diagnostico.sql
SELECT version_num FROM alembic_version;
```

Execute **apenas** o arquivo cuja revision imediatamente segue a sua `version_num` atual.

---

## Índice de arquivos

| Rev | Arquivo SQL | Descrição |
|-----|-------------|-----------|
| — | `000_diagnostico.sql` | Consulta versão e colunas (não altera nada) |
| 001–006 | *(sem SQL — base já existente)* | properties, users, images, events, listing_type |
| 007 | `007_add_property_type.sql` | Coluna `property_type` |
| 008 | `008_land_only_model.sql` | Terreno/lote em `properties` |
| 009 | `009_create_developments.sql` | `developments` + cenários de pagamento |
| 010 | `010_development_costs.sql` | `development_costs` |
| 011 | `011_development_sales_projections.sql` | Projeção mensal de vendas |
| 007→011 | `RUN_ALL_008_to_011.sql` | Atalho (inclui 007 inline + 008–011) |

**Head atual:** `011`

---

## Ordem se estiver atrasado

| `alembic_version` | Próximo arquivo |
|-------------------|-----------------|
| `006` | `007` → `008` → `009` → `010` → `011` |
| `007` | `008` → … |
| `008` | `009` → … |
| `009` | `010` → `011` |
| `010` | `011` |
| `011` | Nada pendente |

---

## Conferência pós-execução

```sql
SELECT version_num FROM alembic_version;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

---

## Onde ficam os arquivos

```
backend/
├── alembic/versions/          ← Python (Alembic — dev/local)
└── supabase/sql/              ← SQL pronto para colar no Supabase
    ├── README.md              ← este guia
    ├── MANIFEST.md            ← histórico (atualizar a cada migration)
    └── _TEMPLATE.sql          ← modelo para novas migrations
```

**Nunca** cole arquivos `.py` no SQL Editor do Supabase.
