# Stub

Digital mementos for live experiences.

Collect and share stubs from concerts, flights, sports events, and more.

## Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL (Homebrew or Docker)
brew services start postgresql@16
# or: docker compose up -d

# Create database
createdb stub_dev

# Run migrations
npm run db:migrate -w server

# Generate Prisma client
cd server && npx prisma generate && cd ..

# Start dev servers
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server |
| `npm run build` | Build both client and server |
| `npm test` | Run all tests |
| `npm run db:migrate -w server` | Run database migrations |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL 16
- **Cache:** Redis 7

## Architecture

Stub follows a modular monolith for v1 with clean internal boundaries:
- `client/` — React PWA (Vite + TypeScript + Tailwind)
- `server/` — Express REST API with Prisma ORM
- `server/prisma/` — Database schema and migrations

## Features

### Phase 1 — Core Loop ✅
- Email/password authentication with JWT access/refresh tokens
- Manual stub logging with event deduplication pipeline
- Personal profile walls with stub collections
- Event catalog with fuzzy matching and tiered trust model

### Phase 2 — Social ✅
- Follow/unfollow other collectors
- Home feed with Redis-powered hybrid fan-out
- Reactions: was_there, jealous, want_to_go (toggle behavior)
- Corroboration: crowd-verified event authenticity (3+ users)
- Discovery: trending events, shared experiences, who else was there

### Phase 3 — Import ✅
- Wallet pass parsing (Apple pkpass + Google Wallet)
- Email ticket confirmation parsing (Ticketmaster, StubHub, Delta, MLB)
- Draft review flow — review, publish, or discard imported stubs
- Batch import with dedup
- Catalog enrichment worker — promotes Tier 3 events to canonical

### Phase 4 — Design System ✅
- 6 standard templates with unique color palettes per event type
- 3 premium templates (Vintage, Gold Foil, Holographic)
- Server-side PNG rendering (node-canvas)
- Async render worker — auto-generates stub images on creation
- Open Graph image generation for social sharing
- Template selector in the new stub form
- Year in Review summary images (watermark-free for Stub+)

### Phase 5 — Monetization ✅
- Stub+ subscription via Stripe (checkout + webhook + customer portal)
- Plan tier enforcement middleware (free vs plus)
- Premium templates gated behind Stub+

### Phase 6 — Growth ✅
- PWA support — installable, offline service worker, manifest
- User-curated collections (create, edit, delete)
- Milestone badges (First Stub → Museum at 250 stubs)
- Framer Motion animations — staggered card reveals
- Share button with Web Share API + clipboard fallback
