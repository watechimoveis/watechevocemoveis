# Watech Imóveis — Admin

Painel administrativo para gestão de imóveis.

## Funcionalidades

- Login com JWT
- Lista de imóveis com paginação
- Criar / editar / excluir via modal (sem trocar de página)
- Clique na linha abre edição direta

## Subir

```bash
# Terminal 1 — API (backend/)
uvicorn app.main:app --reload

# Terminal 2 — Admin
cd admin
npm install
npm run dev
```

Acesse: http://localhost:5173

**Credenciais padrão:** `admin@watech.com` / `admin123`

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
