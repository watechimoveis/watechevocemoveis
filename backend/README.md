# Watech Imóveis — Backend

API REST simples para gestão de imóveis (painel admin + site público).

## Stack

- **FastAPI** — API HTTP
- **PostgreSQL** — banco de dados
- **SQLAlchemy 2** — ORM
- **Alembic** — migrations

## Estrutura

```
backend/
├── app/
│   ├── main.py                 # Entry point
│   ├── config.py               # Variáveis de ambiente
│   ├── modules/
│   │   └── properties/         # Módulo de imóveis
│   │       ├── models.py       # Modelo SQLAlchemy
│   │       ├── schemas.py      # DTOs Pydantic
│   │       ├── repository.py   # Acesso ao banco
│   │       ├── service.py      # Regras de negócio
│   │       ├── controller.py   # Orquestração HTTP
│   │       └── router.py       # Rotas FastAPI
│   └── shared/
│       ├── database/           # Engine e sessão
│       └── errors/             # Tratamento de erros
├── alembic/                    # Migrations
├── docker-compose.yml
└── requirements.txt
```

## Endpoints

Base URL: `http://localhost:8000/api/v1`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/properties` | Criar imóvel (requer auth) |
| GET | `/properties` | Listar imóveis (público) |
| GET | `/properties/{id}` | Detalhe do imóvel (público) |
| PUT | `/properties/{id}` | Atualizar (requer auth) |
| DELETE | `/properties/{id}` | Remover (requer auth) |
| DELETE | `/properties/{id}/images/{image_id}` | Remover foto (requer auth) |
| POST | `/properties/{id}/images` | Upload de fotos multipart (requer auth) |

Imagens servidas em `/uploads/...` (público).

Documentação interativa: `http://localhost:8000/docs`

## Subir com Docker

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Migration:

```bash
docker compose exec api alembic upgrade head
```

## Migrations

- **Local/dev:** `alembic upgrade head` (Docker ou venv).
- **Supabase (produção):** aplicar manualmente os `.sql` em `supabase/sql/` — ver **`supabase/sql/README.md`**.

Toda migration nova exige um `.sql` espelho + atualização do `MANIFEST.md`.

## Desenvolvimento local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
docker compose up db -d
alembic upgrade head
uvicorn app.main:app --reload
```

## Exemplo — criar terreno parcial

```bash
curl -X POST http://localhost:8000/api/v1/properties \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Terreno 360m2 Centro\", \"property_type\": \"terreno\", \"price\": 250000, \"size\": 360, \"agent_whatsapp\": \"5511999999999\"}"
```

## Campos do anúncio (terrenos e lotes)

- `property_type`: `terreno` (avulso) ou `lote` (em loteamento/condomínio). Default `terreno`.
- Básicos: `title`, `location`, `price`, `description`, `size` (área em m²), `agent_whatsapp`.
- Dimensões: `frontage` (frente em m), `depth` (fundo em m).
- Classificação: `zoning` (`residential|commercial|industrial|rural|mixed`), `topography` (`flat|slope_up|slope_down|irregular`), `documentation` (`deed|registration|contract|financing`).
- Booleanos: `gated_community`, `accepts_financing`, `has_water`, `has_electricity`, `has_sewage`, `paved_street`.
- Loteamento: `development_name`, `block`, `lot_number`.

Todos os campos são opcionais (exceto regras de negócio para publicação no site).
