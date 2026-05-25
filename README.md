# W.A.Techevoceimoveis

Monorepo do portal imobiliário **W.A.Techevoceimoveis**.

| App | Pasta | Descrição |
|-----|-------|-----------|
| API | `backend/` | FastAPI + PostgreSQL + Alembic |
| Admin | `admin/` | Painel corretor/admin (React) |
| Site | `website/` | Site público (React) |

## Desenvolvimento local

```bash
# Banco (Docker)
cd backend && docker compose up db -d

# API
cd backend && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Admin — http://localhost:5173
cd admin && npm install && npm run dev

# Site — http://localhost:5174
cd website && npm install && npm run dev
```

Admin padrão (dev): `admin@watech.com` / `admin123`

## Deploy (GitHub + Supabase + Render)

Guia completo: **[DEPLOY.md](./DEPLOY.md)**

Repositório: https://github.com/watechimoveis/watechevocemoveis
