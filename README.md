# Study Notebook — Organised NotebookLM

A block-based notebook with AI summarisation, hybrid search, knowledge graph suggestions, and real-time collaboration.

## Features

- **Block editor** — heading, paragraph, toggle, callout, list, quote, code, image, embed, table, divider, AI assistant
- **AI summarisation** — each block can be summarised via Google Gemini / OpenAI
- **Hierarchical notebooks** — Course → Chapter → Sub-chapter tree
- **Hybrid search** — PostgreSQL full-text + Qdrant vector search
- **Knowledge graph** — AI suggests related concepts in a side panel
- **Real-time collaboration** — Yjs WebSocket sync (placeholder)
- **Drag-and-drop** — dnd-kit powered block reordering

## Quick Start (Docker)

```bash
docker compose -f docker/docker-compose.yml up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Qdrant: http://localhost:6333
- Yjs WebSocket: ws://localhost:1234

## Quick Start (without Docker)

```bash
npm install
npm run dev
```

## API Routes

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| GET | `/api/pages` | — | All pages |
| POST | `/api/pages` | `{ title, parentId }` | New page |
| GET | `/api/pages/:id` | — | Page JSON |
| DELETE | `/api/pages/:id` | — | — |
| PATCH | `/api/blocks/:id` | `{ pageId, updates }` | Updated block |
| POST | `/api/ai/summarise` | `{ blockId, pageId }` | `{ summary }` |
| POST | `/api/search` | `{ query }` | `{ results }` |
| POST | `/api/graph/suggest` | `{ text }` | `{ suggestions }` |

## Production TODO

- [ ] Replace in-memory store with PostgreSQL (Supabase)
- [ ] Implement real Supabase Auth (email + Google SSO)
- [ ] Wire up Qdrant for vector embeddings (text-embedding-3-large)
- [ ] Enable Yjs WebSocket for real-time collaboration
- [ ] Add rate limiting for AI endpoints
- [ ] Add media CDN for image/video uploads
- [ ] Production Dockerfile (multi-stage build)
- [ ] SSR / SEO for public pages
Mon Jun 22 02:43:38 UTC 2026
