# Study Notion Page Builder

A reusable, Notion-style block-based page editor built with **React + TypeScript + Vite** (frontend) and **Express + SQLite** (backend). Designed as a drop-in starter kit that can be imported into any of the five study-website prototypes (StudyBook, QuizCraft, BrainMap, FlashForge, CourseCompass).

---

## Features

- **14 Block Types** – heading, paragraph, toggle, callout, bulleted/numbered list, quote, code, image, video, embed, table, divider, and AI assistant.
- **Inline Editing** – every block supports content-editable fields with on-blur auto-save.
- **Floating Toolbar** – change block type, add below, duplicate, delete, and add child blocks (for toggles/callouts).
- **Drag & Drop Reordering** – powered by `@dnd-kit` with smooth animations and drag preview.
- **AI Assistant Block** – ask questions and get AI-generated callout responses.
- **Export / Import** – convert pages to/from Markdown.
- **SQLite Persistence** – minimal Express API with GET, POST, PUT endpoints.
- **Example Pages** – 5 pre-filled JSON files matching each study prototype.
- **Jest Tests** – one test per block component.
- **Docker Compose** – one command to spin up frontend + backend.

---

## Quick Start

### With Docker

```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:4000

### Without Docker

```bash
# Install dependencies
npm install

# Start the backend API
npm run server

# In another terminal, start the Vite dev server
npm run dev
```

---

## Project Structure

```
study-notion-page-builder/
├─ src/
│  ├─ api/
│  │   └─ pages.ts                 # Axios wrappers for GET/POST/PUT
│  ├─ components/
│  │   ├─ blocks/
│  │   │   ├─ HeadingBlock.tsx
│  │   │   ├─ ParagraphBlock.tsx
│  │   │   ├─ ToggleBlock.tsx
│  │   │   ├─ CalloutBlock.tsx
│  │   │   ├─ ListBlock.tsx
│  │   │   ├─ QuoteBlock.tsx
│  │   │   ├─ CodeBlock.tsx
│  │   │   ├─ MediaBlock.tsx
│  │   │   ├─ EmbedBlock.tsx
│  │   │   ├─ TableBlock.tsx
│  │   │   ├─ DividerBlock.tsx
│  │   │   └─ AIAssistantBlock.tsx
│  │   └─ toolbar/
│  │       └─ BlockToolbar.tsx
│  ├─ hooks/
│  │   └─ usePage.ts
│  ├─ lib/
│  │   ├─ blockSchema.ts
│  │   ├─ markdownExport.ts
│  │   └─ markdownImport.ts
│  ├─ pages/
│  │   └─ PageEditor.tsx
│  └─ App.tsx
├─ server/
│  ├─ index.cjs
│  ├─ routes/
│  │   └─ pages.cjs
│  └─ middleware/
│      └─ auth.cjs
├─ examples/
│   ├─ studybook-overview.json
│   ├─ quizcraft-bank.json
│   ├─ brainmap-canvas.json
│   ├─ flashforge-deck.json
│   └─ coursecompass-syllabus.json
├─ tests/
│   ├─ setup.ts
│   ├─ HeadingBlock.test.tsx
│   ├─ ParagraphBlock.test.tsx
│   ├─ CalloutBlock.test.tsx
│   ├─ QuoteBlock.test.tsx
│   ├─ CodeBlock.test.tsx
│   └─ DividerBlock.test.tsx
├─ docker-compose.yml
├─ package.json
├─ tsconfig.json
├─ jest.config.ts
├─ tailwind.config.js
├─ vite.config.ts
├─ .env.example
└─ README.md
```

---

## API Routes

| Method | Route            | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/pages/:id`     | Fetch a page by ID             |
| POST   | `/pages`         | Create a new page              |
| PUT    | `/pages/:id`     | Update an existing page        |
| POST   | `/api/ai/assist` | AI assistant placeholder       |
| GET    | `/health`        | Health check                   |

---

## Testing

```bash
npm test
```

Tests are located in `tests/` and cover rendering of each block component.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable         | Default               | Description               |
|------------------|-----------------------|---------------------------|
| `VITE_API_URL`   | `http://localhost:4000` | Backend API base URL      |
| `OPENAI_API_KEY` | *(empty)*             | For real AI generation    |
| `JWT_SECRET`     | *(empty)*             | Placeholder for auth      |
| `PORT`           | `4000`                | Express server port       |

---

## TODO / Roadmap

- [ ] **Authentication** – replace placeholder JWT middleware with real OAuth / JWT flow.
- [ ] **Rate Limiting** – add rate limits for AI assistant calls (express-rate-limit).
- [ ] **Media CDN** – upload images/videos to S3 / Cloudflare R2 instead of hot-linking.
- [ ] **Full Markdown Fidelity** – improve import/export for nested lists, tables, and inline formatting.
- [ ] **Production Dockerfile** – multi-stage build for smaller images.
- [ ] **SSR / SEO** – add Next.js or Remix adapter if needed for SEO-heavy pages.
- [ ] **Supabase Migration** – swap SQLite for PostgreSQL (Supabase) in production.
- [ ] **Real-time Collaboration** – integrate Yjs or Liveblocks for multi-user editing.

---

## License

MIT
