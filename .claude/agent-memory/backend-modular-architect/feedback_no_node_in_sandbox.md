---
name: Sandbox has no node/npm/npx
description: The sandboxed bash in this project does not have node, npm, or npx on PATH - cannot run prisma/tsc/build commands directly
type: feedback
---

The Bash tool sandbox has no `node`, `npm`, or `npx` binary. Even though `node_modules/.bin/prisma` and `node_modules/.bin/tsc` exist, they are JS scripts with `#!/usr/bin/env node` shebangs and cannot be invoked.

**Why:** The sandbox is a constrained Linux environment (no nvm, no system node package). Confirmed by `command -v node` returning empty and full filesystem search for `node` executable returning nothing.

**How to apply:** When the user asks to run `npx prisma migrate dev`, `npx tsc --noEmit`, `npm run build`, etc., do not attempt to execute them - they will fail. Instead:
1. Make all code/schema changes correctly so they will compile and migrate when the user runs the commands themselves.
2. Generate manual migration SQL files under `backend/prisma/migrations/<timestamp>_<name>/migration.sql` when an enum rename or other non-auto-detectable change is needed.
3. Document precisely the commands the user must run, in the commit log (`backend-commit-file.md`) and the final response.
4. Do a careful manual review of types, imports, and Prisma model name camelCasing (e.g., `ETFRating` -> `prisma.eTFRating`, `KYC` -> `prisma.kYC`) since you cannot rely on tsc to catch errors.
