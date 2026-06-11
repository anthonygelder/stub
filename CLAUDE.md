# CLAUDE.md

Stub is a TypeScript PWA monorepo for collecting and sharing digital "stubs" (mementos) from live events — concerts, flights, and sports.

## Architecture

npm-workspaces monorepo with two packages:

- **`client/`** — React 18 + Vite PWA. Tailwind CSS, TanStack Query (server state),
  Zustand (`src/store/auth.ts`), React Router, Framer Motion. Pages in `src/pages/`,
  reusable UI in `src/components/`, HTTP layer in `src/api/client.ts`.
- **`server/`** — Express REST API (`src/app.ts` is the app factory; `src/index.ts`
  boots it). Layered design:
  - `src/routes/*.routes.ts` — thin HTTP handlers, all mounted under `/api/*`.
  - `src/services/*.service.ts` — core business logic (auth, stub, event, feed,
    social, import, billing, render, enrichment, …). **Most logic lives here.**
  - `src/middleware/` — auth/JWT, passport (Google/Apple OAuth), rate limiter,
    error handler. `src/lib/` — prisma, redis, logger. `src/workers/` — async
    render + enrichment workers. `src/templates/` — stub design templates.
- **`server/prisma/schema.prisma`** — data model (8 models: User, Event, Stub,
  Follow, Reaction, Collection, CollectionStub, Corroboration). Migrations in
  `server/prisma/migrations/`.

**Datastores:** PostgreSQL 16 (via Prisma) and Redis 7 (feed fan-out / caching).
`docker-compose.yml` provides both locally (user `stub` / pw `stub` / db `stub_dev`).

**Deploy:** Railway (`railway.toml`, nixpacks); a GitHub Pages workflow also builds
the client. Server serves the client build under `/stub` in production.

## Environment setup (IMPORTANT — non-obvious gotchas)

This machine needs specific handling to build and test:

1. **Use Node 20, not 24.** The `canvas` native dep (`canvas@2.11.2`) does not build
   on Node 24. Node 20 (the version CI uses) works: `nvm use 20`.
2. **C++ stdlib workaround.** The Command Line Tools' bundled libc++ headers are
   incomplete on this OS (Darwin 25.5), so native builds fail with
   `fatal error: 'exception' file not found`. Point the compiler at the SDK's copy:
   `export CPLUS_INCLUDE_PATH="/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1"`
3. **canvas build libs:** `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
   and `export PKG_CONFIG_PATH="$(brew --prefix)/lib/pkgconfig:$PKG_CONFIG_PATH"`.
4. **Port 5432 conflict.** A brew `postgresql@16` service may squat on `localhost:5432`
   and shadow the Docker container (causes Prisma `P1010` access-denied). Stop it with
   `brew services stop postgresql@16` so Docker owns the port.

Install (with the env above set): `npm install --legacy-peer-deps`

## Commands

Run all with Node 20 active and these env vars exported for DB-backed work:
`DATABASE_URL="postgresql://stub:stub@localhost:5432/stub_dev"` and
`REDIS_URL="redis://localhost:6379"`.

| Task | Command |
|------|---------|
| Start datastores | `docker compose up -d` |
| Dev (client + server) | `npm run dev` |
| Build everything | `npm run build` |
| Build server / client only | `npm run build -w server` / `npm run build -w client` |
| Run all tests | `npm test` |
| Server tests only | `npm run test -w server` |
| Client tests only | `npm run test -w client` |
| Watch tests | `npm run test:watch -w server` (or `-w client`) |
| Lint | `npm run lint` (or `-w server` / `-w client`) |
| Generate Prisma client | `cd server && npx prisma generate` |
| Create/apply dev migration | `npm run db:migrate -w server` |
| Apply migrations (no prompt) | `cd server && npx prisma migrate deploy` |
| Seed DB | `npm run db:seed -w server` |

- Client: http://localhost:5173 · Server: http://localhost:3001 · Health: `/health`

## Testing

- Framework: **Vitest** in both packages (`vitest run`).
- Server tests (`server/src/__tests__/`, Supertest + Prisma) are **integration tests**
  that require a live Postgres + Redis and applied migrations. They run serially
  (`fileParallelism: false`, `pool: 'forks'`).
- Client tests (`client/src/__tests__/`) use jsdom; `framer-motion` is mocked in
  `src/test-setup.ts`.
- Verified baseline: **server 84/84 passing (25 files), client 13/13 passing (6 files).**

## Linting

ESLint 8 with `.eslintrc.cjs` in each package (typescript-eslint; `react-hooks` on
the client). `npm run lint` passes with **0 errors** (some `no-unused-vars` and
`exhaustive-deps` **warnings** remain — non-blocking). `no-explicit-any` is disabled
to match the existing codebase style.

## Known issues / notes

- **`canvas@2.11.2` pins the project to Node 20.** It will not build on Node 24.
  A `.nvmrc` (20) and `engines` (`node >=20 <21`) enforce this. Upgrading `canvas`
  to v3 would unblock Node 24 (it ships prebuilt binaries) but is unverified here.
