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
- Email/password authentication with JWT
- Manual stub logging with event deduplication
- Personal profile walls with stub collections
- Event catalog with fuzzy matching

### Phase 2 — Social ✅
- Follow/unfollow other collectors
- Home feed with Redis-powered fan-out
- Reactions: was_there, jealous, want_to_go
- Corroboration: crowd-verified event authenticity
- Discovery: trending events, shared experiences

### Phase 3 — Import ✅
- Wallet pass parsing (Apple pkpass + Google Wallet)
- Email ticket confirmation parsing (Ticketmaster, StubHub, Delta, MLB)
- Draft review flow — review, publish, or discard imported stubs
- Catalog enrichment worker — promotes Tier 3 events to canonical
