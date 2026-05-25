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

## Exemplo — criar imóvel parcial

```bash
curl -X POST http://localhost:8000/api/v1/properties \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Apartamento centro\", \"price\": 450000, \"agent_whatsapp\": \"5511999999999\"}"
```

## Campos do imóvel

Todos opcionais: `title`, `location`, `price`, `description`, `rooms`, `bathrooms`, `parking`, `size`, `agent_whatsapp`.
