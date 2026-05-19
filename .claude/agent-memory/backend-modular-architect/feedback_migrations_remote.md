---
name: feedback-migrations-remote
description: Prisma migrations run on a remote server — write migration SQL by hand, never run npx/npm/node locally
metadata:
  type: feedback
---

Never run `npx prisma migrate`, `npx prisma generate`, or any npm/npx/node command for this project. Write migration SQL files by hand.

**Why:** Migrations execute on a remote server and there is no Node/npm available locally (also confirmed in the user's auto-memory).
**How to apply:** When a schema change is needed, edit `prisma/schema.prisma` and create `prisma/migrations/<TIMESTAMP>_<name>/migration.sql` manually using the current UTC timestamp (format `YYYYMMDDHHMMSS`) for the folder. Match the SQL style of existing migrations (plain `ALTER TABLE` / `CREATE INDEX` statements). Tell the user to run `prisma migrate deploy` + `prisma generate` on the remote server as a manual step.
