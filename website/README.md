# Watech Imóveis — Site público

Site para visitantes visualizarem imóveis e entrar em contato via WhatsApp.

## Funcionalidades

- Listagem em cards com preço, local e características
- Página de detalhes do imóvel
- Botão WhatsApp com mensagem pré-preenchida (corretor do imóvel)
- Sem login — consome API pública (`GET /properties`)

## Subir

```bash
# Terminal 1 — API (backend/)
uvicorn app.main:app --reload

# Terminal 2 — Site
cd website
npm install
npm run dev
```

Acesse: http://localhost:5174

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router

## Conversão

Fluxo otimizado: Hero → Cards → Detalhes → WhatsApp

- CTA WhatsApp em cada card e na página de detalhes
- Barra fixa de WhatsApp no mobile (detalhes)
- Mensagem automática com título e local do imóvel
