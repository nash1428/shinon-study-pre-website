# Shinon Study Pre-Website

5 prototype learning tools in one Next.js app, deployed on build.io.

## Prototypes

| Route | Description |
|---|---|
| `/studybook` | NotebookLM-style AI outline + summarise |
| `/quizcraft` | Auto-generated multiple-choice quizzes |
| `/brainmap` | AI-generated concept maps (SVG canvas) |
| `/flashforge` | Spaced-repetition flashcards with SRS grading |
| `/coursecompass` | AI-curated learning resource paths |

## Local Development

```bash
npm install
npm run dev
```

Add your `OPENAI_API_KEY` to `.env.local` for real AI generation.

## Deployment

```bash
# Push to GitHub
git push origin main

# Deploy to build.io
git push bld main
```

## TODO Checklist for Production

- [ ] Add persistent database (PostgreSQL / Supabase)
- [ ] Implement user authentication (OAuth / JWT)
- [ ] Add error boundaries and toast notifications
- [ ] Add rate limiting for AI API routes
- [ ] Responsive mobile polish
- [ ] Add analytics / user feedback collection
Fri Jun 19 12:47:40 UTC 2026
