# Deploy — GitHub + Supabase + Render

Repositório: **https://github.com/watechimoveis/watechevocemoveis**

Este projeto inclui `render.yaml` (Blueprint) que cria 3 serviços:

| Serviço Render | Pasta | URL esperada |
|----------------|-------|--------------|
| `watech-api` | `backend/` | https://watech-api.onrender.com |
| `watech-admin` | `admin/` | https://watech-admin.onrender.com |
| `watech-site` | `website/` | https://watech-site.onrender.com |

---

## 1. Subir código no GitHub

No terminal, na pasta do projeto:

```bash
cd c:\Users\Wallace.Silva\projetos\watechimoveis

git init
git add .
git commit -m "Deploy inicial — W.A.Techevoceimoveis"
git branch -M main
git remote add origin https://github.com/watechimoveis/watechevocemoveis.git
git push -u origin main
```

> **Não commite** `.env`, `.venv` ou `node_modules` — o `.gitignore` na raiz já exclui isso.

---

## 2. Supabase (PostgreSQL)

1. [supabase.com](https://supabase.com) → **New project**
2. Anote a senha do banco
3. **Project Settings → Database → Connection string → URI**
4. Use a **Direct connection** (porta `5432`) para migrations
5. Adicione `?sslmode=require` no final da URL

Exemplo:

```text
postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Rodar migrations (uma vez, no seu PC)

```bash
cd backend
.\.venv\Scripts\activate

# Crie backend/.env só para isso (não commite):
# DATABASE_URL=<url direct do Supabase com ?sslmode=require>

alembic upgrade head
```

Confira no **Table Editor** do Supabase: `properties`, `users`, `property_images`, `property_events`.

---

## 3. Render (Blueprint)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Conecte o repo **watechimoveis/watechevocemoveis**
3. O Render detecta o `render.yaml` → **Apply**

### Variáveis obrigatórias (preencher no painel antes do deploy)

No serviço **watech-api → Environment**:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URI do Supabase (pooler ou direct + `?sslmode=require`) |
| `ADMIN_EMAIL` | E-mail do administrador |
| `ADMIN_PASSWORD` | Senha forte (não use `admin123` em produção) |

`JWT_SECRET` é gerado automaticamente pelo Blueprint.

### Após o primeiro deploy

1. Teste: https://watech-api.onrender.com/health → `{"status":"ok"}`
2. Site: https://watech-site.onrender.com
3. Admin: https://watech-admin.onrender.com
4. Login com `ADMIN_EMAIL` / `ADMIN_PASSWORD`

Se renomear os serviços no Render, atualize também:

- `CORS_ORIGINS` na API
- Rewrites `/api/*` e `/uploads/*` nos static sites (ou edite `render.yaml` e redeploy)

---

## 4. Fluxo de atualização

Cada `git push` na branch `main` dispara redeploy automático (se Auto-Deploy estiver ativo).

```bash
git add .
git commit -m "sua mensagem"
git push
```

A API roda `alembic upgrade head` automaticamente em cada deploy (`releaseCommand`).

---

## 5. Fotos dos imóveis (importante)

No plano free, o disco da API é **efêmero** — fotos em `uploads/` podem sumir após redeploy.

**Opções:**

1. **Render Persistent Disk** (pago) montado em `uploads/`
2. **Supabase Storage** (adaptar `image_storage.py` no futuro)

Para testes iniciais funciona; para produção com muitas fotos, planeje storage externo.

---

## 6. Domínio próprio (opcional)

No Render: **Custom Domain** em cada serviço.

Depois atualize:

- `CORS_ORIGINS` na API
- `VITE_ADMIN_URL` no site (rebuild)
- Rewrites nos static sites

---

## Checklist

```
[ ] git push no GitHub
[ ] Supabase criado + alembic upgrade head
[ ] Blueprint Render aplicado
[ ] DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD configurados
[ ] /health OK
[ ] Login admin OK
[ ] Site lista imóveis
[ ] Login corretor (/admin no site) redireciona para painel
```
