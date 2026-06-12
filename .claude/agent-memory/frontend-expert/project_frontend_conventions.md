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

**Plan display labels (marketing rename)**
- Internal subscription enums stay `BASIC | PRO | PRO_PLUS` for ALL API calls.
- Marketing display names: BASIC = "Momments", PRO = "Future Builder", PRO_PLUS = "Visionary". Map enum→label at the display layer only; never send marketing names to the backend.
- Paid plans are annual only on the Pricing page: PRO $39/yr, PRO_PLUS $69/yr. Subscribe posts `{ paymentMethodId, plan, billingInterval: 'year' }` to `/subscriptions`.

**Plan-gated pages**
- Shared component `src/components/UpgradePrompt.tsx` renders a centered full-page upgrade card (props: `feature`, `requiredPlan?: 'PRO' | 'PRO_PLUS'`). Gated pages render `<Sidebar />` + `<UpgradePrompt />` inside `<main>` rather than redirecting, so nav stays consistent.
- PRO/PRO_PLUS pages: Saved Contacts, Important Dates. PRO_PLUS-only: Favorites, Gift Events.

**Cross-page deep-link conventions**
- Send-gift pre-fill via query params: `/send?recipientName=&recipientEmail=&etfSymbol=&amount=`. SendGift reads these in a mount `useEffect`. Used by Gift Events "Send Gift" and the public invite page.
- Gift-claim-after-verify: Register stashes `?claimToken=` into `sessionStorage.pendingClaimToken`; VerifyEmail reads it (or the verify response's `claimToken`) and redirects to `/claim/:token`.

**Constraints**
- Do NOT run npm/npx commands locally (TypeScript not installed; migrations run on remote server).
