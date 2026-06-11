---
name: api-route-scaffold
description: Scaffold a new Stub server API resource following the repo's thin-route / fat-service pattern, wire it into app.ts, and stub a Supertest spec. Use when adding a new REST endpoint or resource to the server, or when the user asks to "add an API route", "create an endpoint", or "add a new resource".
---

# API Route Scaffold

Generates a consistent route + service + test trio for a new server resource,
matching the conventions already used across `server/src`.

## Convention (study an existing example first)

Read a representative resource before generating — e.g. `stub.routes.ts` +
`stub.service.ts`, or `collection.routes.ts` + `collection.service.ts`. The pattern:

- **Routes are thin.** `*.routes.ts` exports an Express `Router`, validates input
  with `zod`, applies auth middleware (`requireAuth` / `optionalAuth` from
  `src/middleware/auth`), and delegates to the service. No business logic.
- **Services are fat.** `*.service.ts` holds the logic and is the only layer that
  touches `prisma` (`src/lib/prisma`) or `redis` (`src/lib/redis`).
- **Errors** are thrown and handled centrally by `src/middleware/errorHandler`.

## Steps

For a resource named `<resource>` (singular, lowercase):

1. **Create the service** `server/src/services/<resource>.service.ts` with exported
   async functions for the requested operations, using the prisma client and the
   existing error/throw style.
2. **Create the routes** `server/src/routes/<resource>.routes.ts`:
   - `import { Router } from 'express'` and define `const router = Router()`.
   - Add zod schemas for request bodies/params.
   - Apply `requireAuth` where the operation is user-scoped.
   - `export default router`.
3. **Mount it** in `server/src/app.ts`: add the import alongside the other route
   imports and an `app.use('/api/<resource>s', <resource>Routes)` line in the
   existing mount block.
4. **Stub a test** `server/src/__tests__/<resource>.test.ts` using `supertest`
   against `createApp()` from `../app`, mirroring an existing spec
   (e.g. `stub.test.ts`). Cover the happy path and an auth-required 401.
5. **Run the tests** (Node 20 + env from CLAUDE.md):
   ```bash
   source "$HOME/.nvm/nvm.sh" && nvm use 20
   export DATABASE_URL="postgresql://stub:stub@localhost:5432/stub_dev"
   export REDIS_URL="redis://localhost:6379"
   npm run test -w server
   ```

## Notes

- If the resource needs new persisted fields, run the `prisma-migration` skill first.
- Keep route paths consistent with siblings (plural nouns under `/api/`).
