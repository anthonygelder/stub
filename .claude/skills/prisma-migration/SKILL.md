---
name: prisma-migration
description: Create and apply a Prisma schema migration for the Stub server. Use when adding/changing a model or field in server/prisma/schema.prisma, or when the user asks to "add a migration", "change the database schema", or "update the data model".
---

# Prisma Migration

Automates Stub's multi-step Prisma migration flow so schema changes stay consistent
with the generated client and the database.

## Preconditions (this repo's environment)

These are mandatory on this machine — see CLAUDE.md "Environment setup":

```bash
source "$HOME/.nvm/nvm.sh" && nvm use 20
export DATABASE_URL="postgresql://stub:stub@localhost:5432/stub_dev"
export REDIS_URL="redis://localhost:6379"
```

Ensure datastores are up (`docker compose up -d`) and brew's postgres is NOT on 5432
(`brew services stop postgresql@16` if Prisma returns `P1010`).

## Steps

1. **Edit the schema.** Apply the requested change to
   `server/prisma/schema.prisma`. Follow existing conventions:
   - `@map("snake_case")` for column names, `@@map("snake_case")` for table names.
   - `String @id @default(uuid())` for primary keys.
   - Add `@@index([...])` for fields used in WHERE/ORDER BY, mirroring nearby models.
2. **Create the migration.** From `server/`:
   ```bash
   cd server && npx prisma migrate dev --name <concise_snake_case_name>
   ```
   Pick a descriptive name (e.g. `add_stub_archived_flag`). This also regenerates
   the client.
3. **Review the generated SQL.** Read the new file under
   `server/prisma/migrations/<timestamp>_<name>/migration.sql` and show it to the
   user. Flag anything destructive (dropped columns/tables, NOT NULL on existing
   data without a default).
4. **Verify.** Run the server tests to confirm nothing broke:
   ```bash
   npm run test -w server
   ```

## Notes

- For non-interactive environments use `prisma migrate deploy` (applies existing
  migrations without prompting) instead of `migrate dev`.
- Never hand-edit an already-applied migration; create a new one.
- If only the client needs regenerating (no schema change), use
  `cd server && npx prisma generate`.
