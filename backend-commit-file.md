# Backend Commit File

Registro de todos los cambios realizados en el backend.

---

## [2026-03-17 20:55] - [NUEVO MODULO] - Full WealthGift Backend MVP

**Accion**: Creacion completa del backend MVP de WealthGift -- plataforma para regalar fondos de inversion (ETFs) a seres queridos.

---

## Complete File Listing

### Root / Config
- `docker-compose.yml` - PostgreSQL 15 service with healthcheck and persistent volume
- `backend/package.json` - Node.js project manifest with all dependencies
- `backend/tsconfig.json` - TypeScript strict config targeting ES2020
- `backend/.env` - Environment variables for local development
- `backend/.env.example` - Environment variables template

### Prisma
- `backend/prisma/schema.prisma` - Database schema with User, Gift, KYC, Agreement models and GiftStatus enum
- `backend/prisma/migrations/20260318015748_init/migration.sql` - Initial migration (auto-generated)

### Shared Kernel
- `backend/src/shared/db/prisma.client.ts` - PrismaClient singleton
- `backend/src/shared/events/event-bus.ts` - In-process EventEmitter-based event bus with typed events
- `backend/src/shared/errors/http-errors.ts` - Custom error hierarchy (HttpError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError, ConflictError)
- `backend/src/shared/utils/jwt.ts` - JWT sign/verify helpers
- `backend/src/shared/utils/hash.ts` - bcrypt password hash/compare helpers
- `backend/src/shared/middleware/auth.middleware.ts` - Bearer token JWT auth middleware
- `backend/src/shared/middleware/error.middleware.ts` - Centralized Express error handler
- `backend/src/shared/middleware/validate.middleware.ts` - Zod schema validation middleware
- `backend/src/shared/types/express.d.ts` - Express Request type augmentation (req.user)

### Auth Module
- `backend/src/modules/auth/auth.types.ts` - RegisterDto, LoginDto, AuthResponse interfaces
- `backend/src/modules/auth/auth.service.ts` - Register and login business logic
- `backend/src/modules/auth/auth.controller.ts` - Request handlers
- `backend/src/modules/auth/auth.routes.ts` - POST /register, POST /login with Zod validation

### ETFs Module
- `backend/src/modules/etfs/etfs.types.ts` - ETF interface
- `backend/src/modules/etfs/etfs.service.ts` - Static ETF catalog with mock prices (9 ETFs: VOO, VTI, QQQ, VGT, IWM, AGG, BND, VEA, VWO)
- `backend/src/modules/etfs/etfs.controller.ts` - Request handlers
- `backend/src/modules/etfs/etfs.routes.ts` - GET /, GET /categories, GET /:symbol

### Gifts Module
- `backend/src/modules/gifts/gifts.types.ts` - CreateGiftDto, GiftResponse, VALID_TRANSITIONS state machine
- `backend/src/modules/gifts/gifts.repository.ts` - Prisma data access layer
- `backend/src/modules/gifts/gifts.service.ts` - Gift creation, listing, claiming, status transitions
- `backend/src/modules/gifts/gifts.controller.ts` - Request handlers
- `backend/src/modules/gifts/gifts.routes.ts` - CRUD + claim routes

### KYC Module
- `backend/src/modules/kyc/kyc.types.ts` - SubmitKYCDto, KYCQuestion interfaces
- `backend/src/modules/kyc/kyc.repository.ts` - Prisma data access layer
- `backend/src/modules/kyc/kyc.service.ts` - KYC submission, SSN confirmation, identity questions, verification
- `backend/src/modules/kyc/kyc.controller.ts` - Request handlers
- `backend/src/modules/kyc/kyc.routes.ts` - POST /submit, POST /confirm-ssn, GET /questions/:claimToken, POST /verify-answers

### Agreements Module
- `backend/src/modules/agreements/agreements.types.ts` - SignAgreementDto interface
- `backend/src/modules/agreements/agreements.service.ts` - Agreement signing logic
- `backend/src/modules/agreements/agreements.controller.ts` - Request handlers
- `backend/src/modules/agreements/agreements.routes.ts` - POST /sign

### Alpaca Module (Broker Integration)
- `backend/src/modules/alpaca/alpaca.types.ts` - KYCData, PortfolioSnapshot, ChartDataPoint, AlpacaService interfaces
- `backend/src/modules/alpaca/alpaca.mock.ts` - Full mock implementation with seeded random chart data
- `backend/src/modules/alpaca/alpaca.service.ts` - Auto-selects mock or real Alpaca Broker API; wires AGREEMENT_SIGNED event to create account + buy ETF

### Portfolio Module
- `backend/src/modules/portfolio/portfolio.types.ts` - PortfolioResponse, HistoryResponse interfaces
- `backend/src/modules/portfolio/portfolio.service.ts` - Portfolio snapshot and price history retrieval
- `backend/src/modules/portfolio/portfolio.controller.ts` - Request handlers
- `backend/src/modules/portfolio/portfolio.routes.ts` - GET /:giftId, GET /:giftId/history

### Notifications Module (Stub)
- `backend/src/modules/notifications/notifications.types.ts` - NotificationPayload interface
- `backend/src/modules/notifications/notifications.service.ts` - Console-logged stub notifications on GIFT_CREATED and ETF_PURCHASED events

### App Entry Points
- `backend/src/app.ts` - Express app with CORS, JSON parsing, all route mounts, error middleware, event listener imports
- `backend/src/server.ts` - HTTP server bootstrap on PORT

---

## API Endpoints

### Health Check
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{ status: "ok" }` |

### Auth (`/api/auth`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/auth/register` | No | `{ email: string, password: string (min 6), name: string }` | `{ token: string, user: { id, email, name } }` (201) |
| POST | `/api/auth/login` | No | `{ email: string, password: string }` | `{ token: string, user: { id, email, name } }` (200) |

### ETFs (`/api/etfs`)
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/etfs` | No | `ETF[]` - Array of `{ symbol, name, category, description, changePercent, price }` |
| GET | `/api/etfs/categories` | No | `string[]` - `["Large Cap", "Technology", "Small Cap", "Bonds", "International"]` |
| GET | `/api/etfs/:symbol` | No | Single `ETF` object or 404 |

### Gifts (`/api/gifts`)
| Method | Path | Auth | Request Body / Params | Response |
|--------|------|------|----------------------|----------|
| POST | `/api/gifts` | Bearer JWT | `{ recipientName, occasion, etfSymbol, amount, note?, deliveryDate }` | GiftResponse (201) |
| GET | `/api/gifts` | Bearer JWT | - | `GiftResponse[]` (sender's gifts) |
| GET | `/api/gifts/:id` | Bearer JWT | - | GiftResponse (owner only) |
| GET | `/api/gifts/claim/:claimToken` | No | - | GiftResponse (public, for recipients) |
| PATCH | `/api/gifts/claim/:claimToken/start` | No | - | GiftResponse (transitions PENDING -> CLAIMING) |

**GiftResponse shape:**
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "recipientName": "string",
  "occasion": "string",
  "etfSymbol": "string",
  "amount": 100.00,
  "note": "string | null",
  "deliveryDate": "2026-03-25T00:00:00.000Z",
  "status": "PENDING | CLAIMING | KYC_SUBMITTED | KYC_VERIFIED | AGREEMENT_SIGNED | ACCOUNT_CREATING | INVESTED | FAILED",
  "claimToken": "uuid",
  "claimLink": "http://localhost:5173/claim/<claimToken>",
  "createdAt": "2026-03-17T00:00:00.000Z"
}
```

### KYC (`/api/kyc`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/kyc/submit` | No | `{ claimToken, fullName, dob, ssn?, ssnLast4 (4 chars), address, city, state, zip }` | KYC record (201) |
| POST | `/api/kyc/confirm-ssn` | No | `{ claimToken: string, ssnLast4: string }` | `{ confirmed: true }` |
| GET | `/api/kyc/questions/:claimToken` | No | - | `KYCQuestion[]` (3 random questions) |
| POST | `/api/kyc/verify-answers` | No | `{ claimToken: string, answers?: any }` | `{ verified: true }` |

**KYCQuestion shape:**
```json
{ "id": "q1", "question": "Which of these cars have you owned?", "options": ["Toyota Camry", "Ford F-150", ...] }
```

### Agreements (`/api/agreements`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/agreements/sign` | No | `{ claimToken: string, signatureBase64: string, agreed: boolean }` | Agreement record (201) |

### Portfolio (`/api/portfolio`)
| Method | Path | Auth | Query Params | Response |
|--------|------|------|-------------|----------|
| GET | `/api/portfolio/:giftId` | Bearer JWT | - | `{ giftId, symbol, accountId, totalValue, gainLoss, gainLossPercent, shares }` |
| GET | `/api/portfolio/:giftId/history` | Bearer JWT | `?period=1D|1W|1M|1Y|ALL` | `{ period, data: [{ date, value }] }` |

---

## Database Schema Summary

### Models
- **User**: id (uuid), email (unique), password (bcrypt hash), name, createdAt. Has many Gifts.
- **Gift**: id (uuid), senderId (FK->User), recipientName, occasion, etfSymbol, amount (float), note (optional), deliveryDate, status (enum), claimToken (unique uuid), alpacaAccountId (optional), alpacaOrderId (optional), createdAt, updatedAt. Has one KYC, one Agreement.
- **KYC**: id (uuid), giftId (unique FK->Gift), fullName, dob, ssnLast4, address, city, state, zip, verified (boolean), verifiedAt (optional), createdAt.
- **Agreement**: id (uuid), giftId (unique FK->Gift), signatureBase64, agreedToTerms, signedAt.

### GiftStatus Enum (State Machine)
```
PENDING -> CLAIMING -> KYC_SUBMITTED -> KYC_VERIFIED -> AGREEMENT_SIGNED -> ACCOUNT_CREATING -> INVESTED
                                                                                              -> FAILED
```

---

## Event Bus Events and Flows

| Event | Emitted By | Payload | Listeners |
|-------|-----------|---------|-----------|
| `gift.created` | gifts.service (createGift) | `{ giftId }` | notifications.service (logs notification) |
| `gift.claimed` | gifts.service (startClaiming) | `{ giftId }` | - |
| `kyc.verified` | kyc.service (verifyAnswers) | `{ giftId, claimToken }` | - |
| `agreement.signed` | agreements.service (signAgreement) | `{ giftId }` | **alpaca.service** (creates account, funds, buys ETF, transitions to INVESTED or FAILED) |
| `alpaca.account_created` | alpaca.service | `{ giftId, accountId }` | - |
| `alpaca.etf_purchased` | alpaca.service | `{ giftId, orderId }` | notifications.service (logs notification) |

### Full Claim Flow (Event-Driven):
1. Sender creates gift -> status PENDING, emits `gift.created`
2. Recipient opens claim link -> `GET /api/gifts/claim/:claimToken`
3. Recipient starts claiming -> `PATCH /claim/:claimToken/start` -> status CLAIMING, emits `gift.claimed`
4. Recipient submits KYC -> `POST /api/kyc/submit` -> status KYC_SUBMITTED
5. Recipient confirms SSN -> `POST /api/kyc/confirm-ssn`
6. Recipient gets & answers questions -> `GET /api/kyc/questions/:claimToken` then `POST /api/kyc/verify-answers` -> status KYC_VERIFIED, emits `kyc.verified`
7. Recipient signs agreement -> `POST /api/agreements/sign` -> status AGREEMENT_SIGNED, emits `agreement.signed`
8. **Automated**: alpaca.service listener catches `agreement.signed` -> creates brokerage account -> funds account -> buys ETF -> status INVESTED (or FAILED), emits `alpaca.account_created` + `alpaca.etf_purchased`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/wealthgift` | PostgreSQL connection string |
| `JWT_SECRET` | `supersecret_change_in_production` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiration |
| `ALPACA_BROKER_KEY` | `mock` | Alpaca Broker API key (set to `mock` for mock mode) |
| `ALPACA_BROKER_SECRET` | `mock` | Alpaca Broker API secret |
| `ALPACA_BASE_URL` | `https://broker-api.sandbox.alpaca.markets` | Alpaca API base URL |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL used to generate claim links |

---

## How to Run

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### Steps

1. **Start PostgreSQL**:
   ```bash
   cd /home/camilo/Alpaca_gift_app
   docker compose up -d
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Run database migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client** (if not already done by migrate):
   ```bash
   npx prisma generate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   Server starts at `http://localhost:3001`

6. **Verify health**:
   ```bash
   curl http://localhost:3001/health
   # -> { "status": "ok" }
   ```

---

## Deviations and Fixes from Original Spec

1. **Import name mismatch fixed**: The spec referenced `findGiftByClaimToken` in kyc.service, agreements.service, and alpaca.service, but gifts.service exports `getGiftByClaimToken`. Fixed by aliasing: `import { getGiftByClaimToken as findGiftByClaimToken }`.

2. **Portfolio service spread order fixed**: Original spec had `symbol` before `...snapshot` spread which would be overwritten by snapshot's `symbol` field. Reordered to spread snapshot first, then override `symbol` with `gift.etfSymbol`.

3. **Alpaca module**: When `ALPACA_BROKER_KEY` is `mock` (default), all brokerage operations use the mock implementation with deterministic seeded random data. No real API calls are made.

4. **KYC verification**: The `verifyAnswers` endpoint auto-approves all answers (mock behavior). In production, this would validate against real identity verification data.

5. **Notifications**: Implemented as console.log stubs. Ready to be replaced with email/SMS service.

---

## ETF Catalog (Available for Gifting)

| Symbol | Name | Category | Mock Price |
|--------|------|----------|------------|
| VOO | Vanguard S&P 500 ETF | Large Cap | $445.23 |
| VTI | Vanguard Total Market ETF | Large Cap | $238.45 |
| QQQ | Invesco QQQ (Nasdaq 100) | Technology | $432.18 |
| VGT | Vanguard Information Technology ETF | Technology | $487.65 |
| IWM | iShares Russell 2000 ETF | Small Cap | $196.32 |
| AGG | iShares Core US Aggregate Bond ETF | Bonds | $97.54 |
| BND | Vanguard Total Bond Market ETF | Bonds | $73.21 |
| VEA | Vanguard FTSE Developed Markets ETF | International | $48.76 |
| VWO | Vanguard FTSE Emerging Markets ETF | International | $41.23 |
