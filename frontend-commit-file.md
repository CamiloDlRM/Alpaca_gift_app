# Frontend Commit File

---
## [2026-04-29] - ETF Ratings, Unified Portfolio, 3 Plans, Gift Validation UI

### Files Created
- `frontend/src/components/ETFRatingWidget.tsx` — Componente de calificaciones de ETFs (estrellas 1-5 + comentario). Muestra promedio, lista de valoraciones recientes, y formulario para calificar (solo usuarios autenticados). Usa `GET /api/etf-ratings/:symbol` y `POST /api/etf-ratings/:symbol`.

### Files Modified
- `frontend/src/store/auth.store.ts` — `subscriptionStatus` actualizado de `'FREE' | 'PRO'` a `'BASIC' | 'PRO' | 'PRO_PLUS'`. Default fallback cambiado de `'FREE'` a `'BASIC'`.

- `frontend/src/pages/Dashboard.tsx` — Vista unificada del portafolio:
  - Llama a `GET /api/portfolio/overview` para obtener saldo total, rendimiento general, e inversiones activas.
  - Hero card con "Saldo Total del Portafolio" + porcentaje de rendimiento general en verde/rojo.
  - Grid de `InvestmentCard` por cada regalo invertido (muestra ETF, destinatario, valor original, valor actual, cambio en $ y %).
  - Badges de plan: BASIC muestra "Plan Basico · X/5 regalos", PRO muestra verde con estrella, PRO_PLUS muestra dorado.
  - Lista de "Regalos en Proceso" solo muestra gifts con status != INVESTED.
  - Eliminado el mock chart data, datos reales del API.

- `frontend/src/pages/Pricing.tsx` — Tres planes:
  - BASIC ($0/mes): hasta 5 regalos, tarifa de envio $0.99 por regalo.
  - PRO ($9.99/mes): regalos ilimitados, sin tarifas. Badge "MAS POPULAR".
  - PRO+ ($19.99/mes): todo PRO + analytics avanzados + soporte 24/7.
  - `SubscribeModal` acepta `plan: 'PRO' | 'PRO_PLUS'` y lo envía al API.
  - Cancelar suscripcion regresa a `'BASIC'` (no `'FREE'`).
  - Cada plan muestra "Plan activo" si es el plan actual del usuario.

- `frontend/src/pages/SendGift.tsx`:
  - `ETFRatingWidget` integrado debajo de la lista de ETFs cuando hay uno seleccionado.
  - `isPro` actualizado: `user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS'`.
  - `PaymentIntentResponse` añadido campo `sendingFee`.
  - Desglose de costos: muestra "Tarifa de envio ($0.99)" en lugar de "Comision de servicio (2.5%)".
  - Banner de límite: "plan BASIC" en lugar de "plan gratuito".
  - Label del email del destinatario actualizado para indicar que debe ser usuario registrado.

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

## [2026-05-15] - Notifications UX, Recipient Sell Refactor, Annual Billing, KYC PIN & Schedule View

### Files Created
- `frontend/src/pages/kyc/KYCPin.tsx` — Nueva pagina para verificacion de PIN de seguridad para destinatarios recurrentes. Al montarse llama a `POST /api/kyc/generate-pin/:claimToken` y muestra el PIN generado (simulando envio por email). El usuario ingresa un codigo de 6 digitos que se valida con `POST /api/kyc/verify-pin/:claimToken`. En exito, redirige a `/claim/:claimToken/agreement`. Maneja estados loading/error/verifying con accesibilidad (role="status", aria-label, role="alert").

- `frontend/src/pages/ScheduleGifts.tsx` — Vista de calendario de regalos programados. Carga regalos del usuario con `GET /api/gifts`, los agrupa por mes del año actual y los muestra en una linea temporal. Cada mes muestra el conteo de regalos (o un link para programar uno nuevo si no hay). Cada regalo aparece como una `Card` con dia, destinatario, ocasion, ETF, monto y badge de status. Boton "Schedule a Gift" en el header que enlaza a `/send`.

### Files Modified
- `frontend/src/pages/Dashboard.tsx` — Mejoras en notificaciones de regalos recibidos:
  - **Paginacion**: Estado `notifPage` con `NOTIFS_PER_PAGE = 3`. Solo se muestran 3 notificaciones por pagina. Controles "Previous/Next" con conteo "Page X of Y" debajo de la lista. Auto-clamp a la ultima pagina valida si se descartan items.
  - **Boton cerrar**: Cada notificacion tiene un boton "×" en `absolute top-2 right-2` (div con `relative`) para descartar. Estado `dismissedGifts: Set<string>` persistido en `localStorage` bajo la clave `dismissed_gift_notifs`. Funcion `dismissGift(id)`. Se filtra `visibleGifts = receivedGifts.filter(g => !dismissedGifts.has(g.id))`.
  - **Boton "View my portfolio"**: Movido para aparecer en la misma fila de la primera notificacion (al lado derecho) con el mismo estilo que los botones "Claim gift"/"View portfolio" (`bg-[#F5C518] text-black font-semibold text-sm px-4 py-2 rounded-lg`). Solo aparece si hay algun regalo `INVESTED` o `REDEEMED`.

- `frontend/src/pages/RecipientDashboard.tsx` — Refactor de venta:
  - Eliminados los estados `sellLoading`, `sellSuccess`, `showSellModal` y la funcion `handleSell`. Eliminado el import de `Button` (ya no se usaba).
  - Eliminada la tarjeta "Sell my investment" y el modal de confirmacion de venta. El banner informativo de "Investment sold successfully" se mantiene (solo lectura).
  - **Header**: Agregado boton de regreso (icono flecha izquierda) que enlaza a `/dashboard` con `aria-label="Back to home"`. Posicionado a la izquierda del logo de WealthGift.

- `frontend/src/pages/RecipientPortfolioPage.tsx` — Funcionalidad de venta movida aqui:
  - `PositionCard` ahora recibe prop `onSold: () => void` para refrescar el portafolio consolidado tras una venta exitosa.
  - Estados locales: `sellGiftToken: string | null`, `sellLoading: boolean`, `sellError: string`.
  - Funcion `handleSell(claimToken: string)` que llama a `POST /api/recipient/portfolio/:claimToken/sell`.
  - En cada gift no redimido del card expandido, junto al link "View detail" se agrega un boton "Sell" pequeño en rojo (`text-red-500 hover:text-red-700 text-xs font-semibold`).
  - Modal de confirmacion con boton "Confirm Sale" (rojo) y "Cancel". Maneja error display dentro del modal.
  - En el callback `onSold`, se re-fetchea `/recipient/portfolio/consolidated` para actualizar la UI.

- `frontend/src/pages/Pricing.tsx` — Precio BASIC y billing anual:
  - Cambiado el texto de la feature "$0.99 sending fee per gift" a "$5.99 sending fee per gift" (Cambio 4a).
  - Footer note actualizado: "* The Basic plan sending fee ($5.99) is charged once per gift sent."
  - **Toggle Monthly/Annual** agregado encima del grid de 3 planes con estado `billing: 'monthly' | 'annual'`. Estilo: switch redondeado con bg-[#F5C518] cuando annual, slider animado.
  - Card de **PRO+**: precio dinamico — `$19.99/month` para monthly, `$49/year` para annual. Texto adicional "Save 80% vs monthly" cuando annual.
  - Nuevo tipo `BillingInterval = 'month' | 'year'`. `SubscribeModal` y `SubscribeModalInner` reciben prop `billingInterval` y muestran "$X/year" o "$X/month" en el header del modal.
  - `apiClient.post('/subscriptions', { paymentMethodId, plan, billingInterval })` ahora incluye `billingInterval` en el body.
  - El modal se invoca con `price` calculado dinamicamente y `billingInterval` derivado de `modalPlan` + `billing`.

- `frontend/src/pages/ClaimGift.tsx` — Deteccion de destinatario recurrente:
  - Tras llamar a `PATCH /api/gifts/claim/:claimToken/start` exitosamente, se hace `GET /api/kyc/returning-check/:claimToken` para determinar si el usuario es recurrente.
  - Si `isReturning: true`, redirige a `/claim/:claimToken/verify-pin`. Si no, redirige a `/claim/:claimToken/kyc/personal`.
  - Fallback: si el endpoint `/kyc/returning-check` falla (por ejemplo, no esta implementado todavia), se procede al flujo KYC estandar.
  - Misma logica aplicada al branch "any other error" del catch (cuando el gift ya esta CLAIMING).

- `frontend/src/App.tsx` — Nuevas rutas:
  - Import: `KYCPin from './pages/kyc/KYCPin'` y `ScheduleGifts from './pages/ScheduleGifts'`.
  - Ruta publica: `<Route path="/claim/:claimToken/verify-pin" element={<KYCPin />} />`
  - Ruta protegida: `<Route path="/schedule" element={<ProtectedRoute><ScheduleGifts /></ProtectedRoute>} />`

- `frontend/src/components/layout/Sidebar.tsx` — Nuevo item de navegacion "Schedule" en el array `navItems`, ubicado entre "My Portfolio" y "Activity". Icono de calendario SVG (path `M8 7V3m8 4V3...`).

### Backend Dependencies (de `backend-commit-file.md`)
- `GET /api/gifts` — Lista de regalos enviados (usado en Dashboard, ScheduleGifts). Shape: `GiftResponse[]` con `id, recipientName, occasion, etfSymbol, amount, deliveryDate, status, claimToken, claimLink, ...`.
- `GET /api/gifts/received` — Regalos recibidos (Dashboard). Mismo shape `GiftResponse`.
- `POST /api/recipient/portfolio/:claimToken/sell` — Venta de inversion (RecipientPortfolioPage). Documentado en backend-commit-file.md.
- `POST /api/subscriptions` — Ahora acepta opcionalmente `billingInterval: 'month' | 'year'` ademas de `paymentMethodId` y `plan`.
- `PATCH /api/gifts/claim/:claimToken/start` — Inicia el proceso de claim (ClaimGift).

### Backend Dependencies NO documentadas en backend-commit-file.md (flagged)
Los siguientes endpoints son consumidos por la implementacion de CAMBIO 5 y CAMBIO 6 pero NO aparecen en `backend-commit-file.md`. El frontend asume su existencia segun la especificacion del usuario:
- `GET /api/kyc/returning-check/:claimToken` → response `{ isReturning: boolean }`.
- `POST /api/kyc/generate-pin/:claimToken` → response `{ pin: string }` (6 digitos).
- `POST /api/kyc/verify-pin/:claimToken` → body `{ pin: string }`, response 200/400.

La logica del frontend incluye try/catch para que si estos endpoints no existen (404) el flujo de claim continue por la ruta estandar KYC personal, evitando dejar al usuario bloqueado. El backend debe implementarlos para que el flujo de PIN sea completamente funcional.

Adicionalmente, el endpoint `POST /api/subscriptions` con `billingInterval: 'year'` debe ser soportado por el backend para que el plan anual PRO+ ($49/year) cobre correctamente. Segun `backend-commit-file.md` actual, solo se documenta `PRO_PLUS` a $19.99/mes.

### Notes
- Se preservaron las animaciones, transiciones de tema dark/light, y patrones existentes (gradientes amarillos para notificaciones de regalo, colores Tailwind semanticos, `role`/`aria-label` para accesibilidad).
- La paginacion de notificaciones usa `safeNotifPage` clamped al maximo valido para evitar pagina vacia si se descarta el ultimo item visible.
- El boton de cierre "×" usa `&times;` Unicode (caracter literal) para evitar parsing de entidad HTML.
- La key del localStorage (`dismissed_gift_notifs`) es global por usuario del navegador; si se requiere por-usuario deberia incluir el `userId`.
- En `RecipientPortfolioPage`, el sell modal usa `bg-white dark:bg-gray-800` directo en vez de `Card` para evitar conflictos de borde.
- En `KYCPin`, mostrar el PIN al usuario es una simulacion de envio por email (apto solo para desarrollo).
- `ScheduleGifts` solo muestra el año actual; futura mejora seria un selector de año.
---

## [2026-05-19] - Email verification flow (register / verify-email / login)

### Files Modified/Created
- `src/store/auth.store.ts` — `register` now returns `Promise<string>` (the backend confirmation message) and no longer stores a token; added `setAuth(token, user)` helper to store the JWT consistently after email verification.
- `src/pages/Register.tsx` — On successful registration, switches to an inline "check your email" state instead of redirecting; shows the destination email and a "Resend email" button calling `POST /auth/resend-verification`.
- `src/pages/VerifyEmail.tsx` — NEW. Reads `token` from query params, calls `GET /auth/verify-email?token=xxx` on mount, shows loading/success/error states, stores the JWT via `setAuth` on success and redirects to `/dashboard` after 2s; error state offers a "Back to register" button.
- `src/pages/Login.tsx` — Detects 403 responses (unverified email) and shows a contextual amber alert with an inline "resend the verification email" flow.
- `src/App.tsx` — Added the `/verify-email` public route.

### Changes Summary
Implemented the full email-verification gate. Registration no longer logs the user in directly; instead it triggers a verification email and the UI prompts the user to check their inbox. The `/verify-email` page consumes the link token, exchanges it for a JWT + user, and logs the user in. Login surfaces a specific, actionable message when the account is unverified, with an inline resend option.

### Backend Dependencies
- `POST /api/auth/register` → `{ message: string }` (no token; verification email sent).
- `POST /api/auth/login` → 403 `{ error: 'Please verify your email before logging in' }` when unverified.
- `GET /api/auth/verify-email?token=xxx` → `{ token, user }` (JWT + user object).
- `POST /api/auth/resend-verification` body `{ email }` → resends the verification email.

### Notes
- JWT is stored exactly like login: `localStorage` key `wealthgift_token` plus the zustand `auth.store` persisted state (`setAuth` centralizes this).
- `VerifyEmail` uses a `useRef` guard so React StrictMode's double effect invocation does not consume the single-use token twice.
- Login treats any 403 as "unverified"; if the backend later returns 403 for other reasons, the message would need to branch on `response.data.error`.
- These backend endpoints were provided in the task brief but are NOT yet documented in `backend-commit-file.md` — recommend the backend agent add an entry for the email-verification work.
- Could not run `tsc` to verify types (TypeScript not installed locally and npm commands are disallowed); types were reviewed manually.
---

---
## [2026-06-01] - Rankings + SENDER/RECEIVER rating role across rating UI and new Leaderboard

### Files Modified/Created
- `frontend/src/components/ETFRatingWidget.tsx` — Reworked `RatingResponse`/`ETFRatingsAggregate` types to the new backend shape; added a `role` field, sender/receiver averages + counts, and `userSenderRating`/`userReceiverRating`. Added a Sender/Receiver role toggle to the rating form (default SENDER), overall/senders/receivers metric chips, and a role badge on each rating in the list. Form pre-populates from the selected role's existing rating and sends `role` in the POST body.
- `frontend/src/components/ETFCommunityReviews.tsx` — Added All/Senders/Receivers filter pill tabs, three header metric chips (overall, senders, receivers with counts), a Sender(blue)/Receiver(green) badge per review card, and role-based filtering of the carousel + dynamic average/count for the active tab.
- `frontend/src/components/ETFReviewForm.tsx` — Switched fetch to the new aggregate shape, tracks both sender and receiver ratings, added a Sender/Receiver pill toggle (default RECEIVER for the recipient portfolio context), and includes `role` in the POST body.
- `frontend/src/components/ETFCategoryRankings.tsx` — NEW. Compact top-3 category cards with medal badges, gold/silver/bronze gradient borders, star rating, trend arrow, gift count, and a "New" badge when there is no gift activity. Calls `onSelectCategory` and highlights the selected one. Loading skeleton included.
- `frontend/src/components/ETFTopRankings.tsx` — NEW. Top-3 ETFs for a given category with medal badges, symbol/name/category, average rating, and gift count. Refetches when `category` changes; calls `onSelectETF`; loading + empty states included.
- `frontend/src/pages/Leaderboard.tsx` — NEW. Full `/leaderboard` page in the Sidebar layout. Category section with a 2-1-3 podium (gold tallest, centered) plus a rank 4+ list. ETF section with All/Large Cap/Technology/Small Cap/Bonds/International tabs, a responsive card grid (top 3 medaled), separate sender/receiver rating metrics per card, skeleton loaders, and a shared "No activity yet — be the first to send a gift!" empty state.
- `frontend/src/pages/SendGift.tsx` — Imported and embedded `ETFCategoryRankings` (before the category dropdown, wired to `setSelectedCategory` and resetting the ETF) and `ETFTopRankings` (after the dropdown, before the ETF picker, wired to `setEtfSymbol`). Existing ETF select retained as the source of truth.
- `frontend/src/App.tsx` — Added `import Leaderboard` and the `/leaderboard` protected route.
- `frontend/src/components/layout/Sidebar.tsx` — Added a Leaderboard nav item (bar-chart icon) immediately after Activity.

### Changes Summary
Aligned the entire ETF rating UI with the new backend contract that distinguishes SENDER vs RECEIVER ratings, and surfaced the new public Rankings API throughout the app: inline ranking guides in the Send Gift flow and a dedicated Leaderboard page.

### Backend Dependencies (from backend-commit-file.md, 2026-06-01)
- `GET /api/etf-ratings/:symbol` → new `ETFRatingsAggregateResponse` with `senderAverageStars`, `senderCount`, `receiverAverageStars`, `receiverCount`, `userSenderRating`, `userReceiverRating`, and `role` on each `RatingResponse`.
- `POST /api/etf-ratings/:symbol` now requires `role: 'SENDER' | 'RECEIVER'` in the body alongside `stars` and optional `comment`.
- `GET /api/rankings/categories` → `CategoryRanking[]`.
- `GET /api/rankings/etfs` → `ETFRanking[]`.
- `GET /api/rankings/etfs/:category` → `{ category, topETFs: ETFRanking[] }`.

### Notes
- `CategoryRanking` and `ETFRanking` types are defined and exported from `ETFCategoryRankings.tsx` / `ETFTopRankings.tsx` and reused by `Leaderboard.tsx` to avoid duplication.
- Role toggle defaults: SENDER in `ETFRatingWidget` (generic), RECEIVER in `ETFReviewForm` (lives on the recipient portfolio page).
- `ETFRatingWidget`'s effect intentionally only refetches on `etfSymbol` change; role switching is handled locally from already-fetched data (eslint-disable on the dep array to document this).
- All ranking components and the Leaderboard are designed to look correct with zero gift activity (show category/ETF names with "New"/seedling empty states).
- Could not run `tsc`/`vite` to verify (TypeScript not installed locally and npm commands disallowed); types were reviewed manually against the backend contract.
---

---
## [2026-06-12] - Calculator AI mode, Pricing redesign, non-registered gift flow, cancel gift, and 5 new pages

### Files Modified
- `src/hooks/useWealthyChat.ts` — Added `'calculator'` to the `WealthyMode` union.
- `src/pages/Wealthy.tsx` — Added the ETF Calculator mode card (🧮, purple gradient) and `calculator` starter prompts.
- `src/components/WealthyWidget.tsx` — Added `calculator` mode tab and starters to the floating widget.
- `src/pages/Pricing.tsx` — Full redesign: Momments/Future Builder/Visionary display labels (internal enums BASIC/PRO/PRO_PLUS unchanged). Removed the monthly/annual toggle; both paid plans annual only ($39 PRO, $69 PRO_PLUS). Subscribe posts `{ paymentMethodId, plan, billingInterval: 'year' }`. Future Builder = MOST POPULAR (yellow border), Visionary = purple border.
- `src/pages/SendGift.tsx` — Removed "recipient must be registered" warning copy; recipient email now optional for scheduled gifts with a helper note. Added URL pre-fill (`recipientName`, `recipientEmail`, `etfSymbol`, `amount`) on mount. Added a PRO/PRO_PLUS-only "Use saved recipient" dropdown backed by `GET /api/saved-recipients`.
- `src/pages/Register.tsx` — Pre-fills email from `?email=`; captures `?claimToken=` into state and writes it to `sessionStorage.pendingClaimToken` on successful registration.
- `src/pages/VerifyEmail.tsx` — After verify, redirects to `/claim/:claimToken` when a token is present (response `claimToken` or `sessionStorage.pendingClaimToken`), clearing it; otherwise `/dashboard`.
- `src/pages/GiftDashboard.tsx` — Fetches gift status via `GET /api/gifts/:id`; adds a destructive "Cancel Gift" button (PENDING only) with a confirm step calling `DELETE /api/gifts/:giftId` with `{ reason }`, success/refund message.
- `src/components/layout/Sidebar.tsx` — Added nav items Saved Contacts, Important Dates, Favorites, Gift Events (between Schedule and Activity).
- `src/App.tsx` — Registered the 4 protected routes + public `/gift-events/invite/:inviteToken`.

### Files Created
- `src/components/UpgradePrompt.tsx` — Shared full-page plan-gate prompt (PRO vs PRO_PLUS copy), CTA to `/pricing`.
- `src/pages/SavedRecipients.tsx` — `/saved-recipients` (PRO/PRO_PLUS). CRUD against `/api/saved-recipients`.
- `src/pages/ImportantDates.tsx` — `/important-dates` (PRO/PRO_PLUS). CRUD against `/api/important-dates` with month dropdown + day/remindDaysBefore inputs.
- `src/pages/FavoriteRecipients.tsx` — `/favorites` (PRO_PLUS only). CRUD against `/api/favorites` with dynamic multi-schedule rows.
- `src/pages/GiftEvents.tsx` — `/gift-events` (PRO_PLUS only). "My Events" tab (`GET/POST /api/gift-events`, `PATCH /:id/close`, create modal with dynamic participants) and "Invited" tab (`GET /api/gift-events/invited`, `PATCH /api/gift-events/invite/:token/accept|decline`, Send Gift deep-link).
- `src/pages/GiftEventInvite.tsx` — Public `/gift-events/invite/:inviteToken`. Standalone WealthGift-branded page (no sidebar). `GET /api/gift-events/invite/:token`; Accept / Send Gift / declined / gifted states.

### Backend Dependencies (consumed)
- Documented in backend-commit-file.md: `DELETE /api/gifts/:giftId` (confirmed present in gifts.routes.ts as cancelGiftHandler), `GET /api/gifts/:id`, `POST /api/subscriptions` with `plan`/`billingInterval`, `POST /api/payments/create-intent` with optional `recipientEmail`, `GET /auth/verify-email`.
- NOT documented in backend-commit-file.md (contracts taken from the task brief only): `/api/saved-recipients`, `/api/important-dates`, `/api/favorites`, `/api/gift-events` (+ `/invited`, `/:id/close`, `/invite/:token`, `/invite/:token/accept|decline`), the `calculator` Wealthy mode, the `claimToken` field on the verify-email response, and the relaxed (no-longer-required) recipient registration in payments/gifts. These should be verified against the actual backend before release.

### Notes
- Internal subscription enums remain `BASIC`/`PRO`/`PRO_PLUS` for all API calls; only display labels changed (Momments/Future Builder/Visionary).
- The new Pricing page no longer charges $5.99 BASIC fee in copy — uses $4.99 per gift per the task brief (backend BASIC_SENDING_FEE is documented as $5.99 — flag for backend alignment).
- Plan-gated pages render the sidebar plus a centered UpgradePrompt rather than redirecting, so navigation stays consistent.
- Could not run tsc/vite locally (not installed; npm disallowed) — types reviewed manually against the provided contracts.
---
