---
name: project-auth-module
description: WealthGift backend auth module conventions — error classes, validate middleware scope, migration workflow
metadata:
  type: project
---

The WealthGift backend lives at `/home/camilo/Alpaca_gift_app/backend`.

Auth module facts (as of 2026-05-19):
- `src/shared/errors/http-errors.ts` already defines a full HttpError hierarchy: `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `BadRequestError` (400), `ConflictError` (409). Reuse these — do not create new error classes for standard status codes.
- The `validate(schema)` middleware in `src/shared/middleware/validate.middleware.ts` validates ONLY `req.body`. For routes that take query params, validate inside the handler instead.
- Email verification flow: register() returns `{ message }` with NO JWT; user must verify before login. `verifyEmail(token)` and `login()` return the JWT-bearing `AuthResponse`.

**Why:** These conventions were discovered while implementing email-verification on signup.
**How to apply:** When extending auth or adding routes, reuse existing error classes and remember `validate` won't cover query/params.
