# Alembic (migrations Python)

Arquivos em `versions/` definem o schema para **dev/local** e documentação.

## Produção (Supabase)

**Não use** `alembic upgrade head` no Supabase.

Aplique manualmente os SQL em:

```
backend/supabase/sql/
```

Leia: **`backend/supabase/sql/README.md`**

Ao adicionar migration aqui, **obrigatório** criar o `.sql` espelho e atualizar `MANIFEST.md`.
