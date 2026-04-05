# Frontend Commit File

---
## [2026-03-17] - Complete WealthGift Frontend MVP

### Files Modified/Created

**Configuration**
- `frontend/package.json` — Project manifest with React, Vite, TailwindCSS, Zustand, Axios, Recharts, react-router-dom
- `frontend/vite.config.ts` — Vite config with React plugin, dev server on 5173, proxy /api to backend on 3001
- `frontend/tailwind.config.ts` — TailwindCSS config with brand colors (primary, navy, positive), Inter font
- `frontend/postcss.config.js` — PostCSS with TailwindCSS and Autoprefixer
- `frontend/tsconfig.json` — TypeScript strict config targeting ES2020 with bundler module resolution
- `frontend/.env` — VITE_API_URL pointing to localhost:3001
- `frontend/index.html` — Root HTML with Inter font from Google Fonts

**Core**
- `frontend/src/main.tsx` — React 18 entry point with StrictMode
- `frontend/src/index.css` — TailwindCSS directives + sparkle keyframe animation
- `frontend/src/vite-env.d.ts` — Vite client type reference for import.meta.env
- `frontend/src/App.tsx` — React Router v6 with all routes, ProtectedRoute component for auth-gated pages

**API & State**
- `frontend/src/api/client.ts` — Axios instance with baseURL from env, JWT Bearer token interceptor from localStorage
- `frontend/src/store/auth.store.ts` — Zustand auth store with persist middleware; login, register, logout actions calling /api/auth/*
- `frontend/src/store/gift.store.ts` — Zustand gift flow store for claim token and KYC data during claim flow

**UI Components**
- `frontend/src/components/ui/Logo.tsx` — Brand logo (yellow circle with W wave SVG + WealthGift text) with sm/md/lg sizes
- `frontend/src/components/ui/Button.tsx` — Reusable button with primary/secondary/ghost variants, sm/md/lg sizes, loading spinner
- `frontend/src/components/ui/Card.tsx` — Card wrapper with white bg, rounded-xl, subtle shadow, border
- `frontend/src/components/ui/Input.tsx` — Form input with label, error state, ring focus style

**Layout Components**
- `frontend/src/components/layout/Nav.tsx` — Top navigation with logo, Home/Activity/Profile links, Login/Logout button, sticky positioning
- `frontend/src/components/layout/Sidebar.tsx` — Dark navy sidebar with SVG icon nav items, active state, logout button, hidden on mobile

**Pages**
- `frontend/src/pages/Landing.tsx` — Full landing page with hero (headline, CTA, decorative SVG chart, floating cards), How It Works section, testimonials with star ratings, yellow CTA banner, dark footer
- `frontend/src/pages/Login.tsx` — Centered login form with logo, email/password inputs, error handling, link to register
- `frontend/src/pages/Register.tsx` — Centered registration form with name/email/password, client-side password validation, error handling
- `frontend/src/pages/SendGift.tsx` — Gift sending form: recipient name, occasion dropdown, category-filtered ETF selection cards (fetched from GET /api/etfs and /api/etfs/categories), amount, delivery date, optional note. Success state shows claim link with copy button
- `frontend/src/pages/ClaimGift.tsx` — Public claim page: fetches gift via GET /api/gifts/claim/:claimToken, shows gift details (amount, ETF, occasion, note), adult/guardian option buttons, calls PATCH /claim/:claimToken/start
- `frontend/src/pages/kyc/KYCPersonal.tsx` — KYC personal info form with progress bar, fields for full name, DOB, SSN last 4, address, city, state dropdown (all US states), ZIP. Submits to POST /api/kyc/submit
- `frontend/src/pages/kyc/KYCSSN.tsx` — SSN confirmation step with progress bar, gift summary card, 4-digit input. Submits to POST /api/kyc/confirm-ssn
- `frontend/src/pages/kyc/KYCQuestions.tsx` — Identity questions: fetches from GET /api/kyc/questions/:claimToken, displays one question at a time with radio-style option buttons, submits all answers to POST /api/kyc/verify-answers
- `frontend/src/pages/kyc/KYCSuccess.tsx` — Success state with green checkmark, animated gold sparkles (CSS keyframe), progress bar complete, continue button to agreement
- `frontend/src/pages/Agreement.tsx` — Scrollable agreement text card with 6 sections, download PDF stub, terms checkbox, canvas signature pad with mouse+touch event handling, clear button. Submits to POST /api/agreements/sign with base64 signature
- `frontend/src/pages/GiftDashboard.tsx` — Individual gift portfolio view: fetches from GET /api/portfolio/:giftId and /api/portfolio/:giftId/history?period=. Shows total value, gain/loss, period tabs (1D/1W/1M/1Y/ALL), Recharts AreaChart with gold gradient fill, holdings row, disclaimer
- `frontend/src/pages/Dashboard.tsx` — Full dashboard with sidebar, stat cards (total gifted, gifts sent, invested, pending), tabbed content (Overview/Performance/Statements/Documents), Recharts portfolio chart, gifts list with status badges and colored pill labels, right sidebar with upcoming gifts and education center cards

### Changes Summary
Complete frontend implementation for the WealthGift platform. Built all 13 pages covering the full user journey: landing page, authentication (login/register), gift sending with ETF selection, public gift claiming, 4-step KYC verification flow, agreement signing with canvas signature pad, individual gift portfolio dashboard with Recharts charts, and full dashboard with sidebar navigation. All pages are mobile responsive, use the brand design system (yellow #F5C518 primary, navy sidebar, Inter font), handle loading/error/empty states, and make real API calls through an Axios client with JWT token injection.

### Backend Dependencies
- `POST /api/auth/register` — User registration (email, password, name) -> token + user
- `POST /api/auth/login` — User login (email, password) -> token + user
- `GET /api/etfs` — ETF catalog array (symbol, name, category, description, changePercent, price)
- `GET /api/etfs/categories` — Category string array
- `POST /api/gifts` — Create gift (recipientName, occasion, etfSymbol, amount, note?, deliveryDate)
- `GET /api/gifts` — List sender's gifts (Bearer JWT)
- `GET /api/gifts/claim/:claimToken` — Public gift fetch for recipients
- `PATCH /api/gifts/claim/:claimToken/start` — Transition gift to CLAIMING status
- `POST /api/kyc/submit` — Submit KYC data (claimToken, fullName, dob, ssnLast4, address, city, state, zip)
- `POST /api/kyc/confirm-ssn` — Confirm SSN last 4 digits (claimToken, ssnLast4)
- `GET /api/kyc/questions/:claimToken` — Fetch identity verification questions
- `POST /api/kyc/verify-answers` — Submit question answers (claimToken, answers)
- `POST /api/agreements/sign` — Sign agreement (claimToken, signatureBase64, agreed)
- `GET /api/portfolio/:giftId` — Portfolio snapshot (giftId, symbol, totalValue, gainLoss, gainLossPercent, shares)
- `GET /api/portfolio/:giftId/history?period=` — Price history for chart (period: 1D|1W|1M|1Y|ALL, data: [{date, value}])

### Notes
- The Vite build produces a single chunk of ~650KB (Recharts is heavy). For production, code-splitting with dynamic imports on route level would reduce initial load.
- The signature canvas uses devicePixelRatio scaling for crisp rendering on retina displays.
- The dashboard chart uses locally generated mock data for the overview since there's no dedicated "total portfolio" endpoint; individual gift charts use real API data.
- The claim flow is fully public (no auth required) as specified.
- Error handling uses Axios error response shape extraction throughout.
- All components use semantic HTML (nav, main, aside, button, form) and include aria-labels/roles where appropriate.
---

---
## [2026-04-05] - Stripe Payments, PRO Subscriptions, Recipient Dashboard, Pricing Page

### Files Modified/Created

**Modified**
- `frontend/src/store/auth.store.ts` — Added `subscriptionStatus: 'FREE' | 'PRO'` to User type, added `updateUser(partial)` action, default subscriptionStatus to 'FREE' on login/register
- `frontend/src/pages/SendGift.tsx` — Full rewrite: 2-step flow (gift form + Stripe payment), FREE plan limit check (5 gifts), `POST /api/payments/create-intent` integration, cost breakdown with commission display, Stripe CardElement for payment, success/error states
- `frontend/src/pages/Dashboard.tsx` — Added subscription status sync via `GET /api/subscriptions` on load, PRO badge (green with star icon) or FREE badge (gray with gift count + Upgrade link) next to welcome header
- `frontend/src/pages/Agreement.tsx` — Changed post-sign navigation from `/dashboard` to `/recipient/${claimToken}/dashboard`
- `frontend/src/App.tsx` — Added imports and routes for Pricing (`/pricing`) and RecipientDashboard (`/recipient/:claimToken/dashboard`)
- `frontend/src/components/layout/Sidebar.tsx` — Added "Pricing" nav item with star icon linking to `/pricing`

**Created**
- `frontend/src/pages/Pricing.tsx` — Pricing page with FREE/PRO plan cards, Stripe-powered subscription modal (`POST /api/subscriptions`), cancel subscription (`DELETE /api/subscriptions`), success banner, responsive grid layout
- `frontend/src/pages/RecipientDashboard.tsx` — Recipient portfolio view (public, no auth): portfolio value with gain/loss, Recharts AreaChart with period tabs (1D/1W/1M/1Y/ALL), holdings card, transaction history table with type badges, sell investment flow with confirmation modal, 30s polling for value updates

### Changes Summary
Implemented the full monetization and recipient experience frontend. The Pricing page presents FREE and PRO plans with Stripe-powered subscription checkout. SendGift was rewritten as a 2-step flow: gift form with FREE plan limit enforcement (5 gifts max), then Stripe payment with cost breakdown showing commission (2.5% for FREE, $0 for PRO). RecipientDashboard provides a standalone portfolio view for gift recipients accessed via claimToken, with real-time value charts, transaction history, and a sell-to-redeem flow. The Dashboard now syncs subscription status on load and displays plan badges. Agreement now redirects recipients to their portfolio dashboard after signing.

### Backend Dependencies
- `POST /api/payments/create-intent` (JWT) — Creates Stripe PaymentIntent with gift data, returns clientSecret + cost breakdown
- `GET /api/subscriptions` (JWT) — Returns current subscription plan and status
- `POST /api/subscriptions` (JWT) — Creates PRO subscription with Stripe paymentMethodId
- `DELETE /api/subscriptions` (JWT) — Cancels PRO subscription
- `GET /api/recipient/portfolio/:claimToken` — Recipient portfolio data (public)
- `GET /api/recipient/portfolio/:claimToken/history?period=` — Price history for recipient chart (public)
- `POST /api/recipient/portfolio/:claimToken/sell` — Sell/redeem recipient investment (public)
- `GET /api/gifts` (JWT) — Used to count sender's gifts for FREE plan limit check

### Notes
- Stripe publishable key is hardcoded as `pk_test_...` (test mode). For production, this should be moved to `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`.
- The RecipientDashboard polls every 30s for portfolio value updates with proper cleanup on unmount.
- The sell confirmation modal includes a "cannot be undone" warning and handles the isRedeemed state to show appropriate messaging.
- Chunk size increased to ~686KB due to Stripe.js additions; code-splitting on routes would reduce initial load.
- All new components handle loading, error, and empty states with proper aria attributes.
---
