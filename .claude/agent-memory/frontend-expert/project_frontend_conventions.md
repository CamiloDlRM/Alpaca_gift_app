---
name: frontend-conventions
description: WealthGift frontend stack, auth/token storage, routing, and shared UI component conventions
metadata:
  type: project
---

WealthGift frontend lives at `/home/camilo/Alpaca_gift_app/frontend` — React + Vite + TypeScript + TailwindCSS.

**Auth & token storage**
- State managed by zustand store `src/store/auth.store.ts`, persisted under name `wealthgift-auth`.
- JWT is stored in BOTH `localStorage` key `wealthgift_token` AND the persisted zustand state.
- `setAuth(token, user)` centralizes login-style token storage — call it after email verification or any flow that produces a JWT outside `login`.
- `register` no longer logs the user in: it returns `Promise<string>` (a confirmation message); the user must verify their email before authenticating.

**API client**
- `src/api/client.ts` exports an axios instance (`apiClient`) as both named and default export; baseURL is `${VITE_API_URL || 'http://localhost:3001'}/api`.
- Request interceptor auto-attaches `Authorization: Bearer <token>` from localStorage.

**Routing**
- All routes defined in `src/App.tsx` via react-router-dom. `ProtectedRoute` wrapper redirects to `/login` when no token.

**Shared UI components** (`src/components/ui/`)
- `Button` — variants `primary` (brand yellow `#F5C518`), `secondary`, `ghost`; sizes `sm|md|lg`; `loading` prop renders a spinner.
- `Input` — `label` and `error` props; styled with focus ring `#F5C518`.
- `Logo` — `size` prop.

**Styling**
- Brand accent color is `#F5C518` (yellow), used as `text-[#F5C518]` / `bg-[#F5C518]`.
- Dark mode supported throughout via `dark:` variants (gray-900/800 backgrounds, gray-100/400 text).
- Auth pages pattern: `min-h-screen bg-gray-50 dark:bg-gray-900` centered, `max-w-md` card with `rounded-2xl shadow-sm border`.

**Constraints**
- Do NOT run npm/npx commands locally (TypeScript not installed; migrations run on remote server).
