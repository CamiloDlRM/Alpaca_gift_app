# Backend Commit File

Registro de todos los cambios realizados en el backend.

---

## [2026-05-15] - KYC bypass con PIN dinámico, fee BASIC $5.99, precio anual Pro Plus $49

### Cambios realizados

**1. Fee BASIC actualizado a $5.99**
- `src/modules/payments/payments.service.ts`: `BASIC_SENDING_FEE` de `0.99` → `5.99`

**2. Schema Prisma — campos PIN dinámico en Gift**
- `prisma/schema.prisma`: nuevos campos opcionales en `Gift`:
  - `claimPin String?`
  - `claimPinExpiry DateTime?`
- `prisma/migrations/20260515120000_add_claim_pin_to_gift/migration.sql`: migración SQL

**3. KYC Bypass — destinatarios recurrentes con PIN dinámico**
- `src/modules/kyc/kyc.service.ts`: 3 nuevas funciones + imports de prisma/hash
- `src/modules/kyc/kyc.controller.ts`: 3 nuevos handlers
- `src/modules/kyc/kyc.routes.ts`: 3 nuevas rutas:
  - `GET /kyc/returning-check/:claimToken` → `{ isReturning: boolean }`
  - `POST /kyc/generate-pin/:claimToken` → `{ pin: string }` (PIN 6 dígitos, válido 15 min)
  - `POST /kyc/verify-pin/:claimToken` body: `{ pin: string }` → `{ success: boolean }`

**4. Precio anual Pro Plus — $49/año**
- `src/modules/subscriptions/subscriptions.types.ts`:
  - nueva constante `PRO_PLUS_ANNUAL_PRICE_CENTS = 4900`
  - `CreateSubscriptionDto` tiene nuevo campo `billingInterval?: 'month' | 'year'`
- `src/modules/subscriptions/subscriptions.service.ts`:
  - Si `billingInterval === 'year'` y plan `PRO_PLUS`, usa $49 en Stripe
  - Para todo lo demás, mantiene precio mensual original

### Migración a ejecutar en servidor remoto
```sql
ALTER TABLE "Gift" ADD COLUMN "claimPin" TEXT;
ALTER TABLE "Gift" ADD COLUMN "claimPinExpiry" TIMESTAMP(3);
```

---

## [2026-04-29 12:00] - [SCHEMA PRISMA] + [MIGRACIÓN] + [NUEVO MÓDULO] + [MODIFICACIÓN] x4

**Acción**: Cuatro cambios coordinados: (1) sistema de calificación de ETFs, (2) validación de email del destinatario, (3) tres planes de suscripción (BASIC, PRO, PRO_PLUS), (4) endpoint de overview del portfolio.

### Schema Prisma y Migración

**Archivo**: `backend/prisma/schema.prisma`
- Renombrado `FREE` -> `BASIC` en los enums `SubscriptionStatus` y `SubscriptionPlan`.
- Añadido nuevo valor `PRO_PLUS` a ambos enums.
- Cambiados los `@default(FREE)` a `@default(BASIC)` en `User.subscriptionStatus` y `Subscription.plan`.
- Añadido nuevo modelo `ETFRating` (id, userId, etfSymbol, stars 1-5, comment opcional, createdAt, updatedAt) con `@@unique([userId, etfSymbol])`.
- Añadida relación `etfRatings ETFRating[]` en `User`.

**Archivo**: `backend/prisma/migrations/20260429120000_add_etf_ratings_three_plans/migration.sql`
- Migración manual cuidadosamente ordenada para preservar datos existentes:
  1. DROP DEFAULT en `User.subscriptionStatus` y `Subscription.plan` (Postgres no permite renombrar valores enum referenciados por defaults).
  2. `ALTER TYPE ... RENAME VALUE 'FREE' TO 'BASIC'` en ambos enums.
  3. `ALTER TYPE ... ADD VALUE 'PRO_PLUS'` en ambos enums.
  4. Restablecer DEFAULT a `'BASIC'`.
  5. CREATE TABLE `ETFRating` + UNIQUE INDEX en `(userId, etfSymbol)` + FK a `User`.

### CHANGE 1: ETF Rating System

**Nuevo módulo**: `backend/src/modules/etf-ratings/`
- `etf-ratings.types.ts` - Interfaces `CreateRatingDto`, `RatingResponse`, `ETFRatingsAggregateResponse`.
- `etf-ratings.repository.ts` - `upsertRating`, `findByETF`, `findByUserAndETF` usando `prisma.eTFRating` con `include: { user: { select: { id, name } } }`.
- `etf-ratings.service.ts` - Validación de símbolo contra catálogo, validación de stars 1-5, agregado de promedio y conteo total.
- `etf-ratings.controller.ts` - `upsertRatingHandler` (auth requerido), `getRatingsHandler` (público pero detecta token Bearer opcional para incluir `userRating`).
- `etf-ratings.routes.ts` - `POST /:symbol` (auth + zod schema), `GET /:symbol` (público).
- `index.ts` - Barrel export del router.

**Nuevo router montado**: `app.use('/api/etf-ratings', etfRatingsRouter)` en `backend/src/app.ts`.

### CHANGE 2: Validación de email del destinatario

**Archivo**: `backend/src/modules/auth/auth.service.ts`
- Añadidas funciones helper `findUserByEmail(email)` e `isEmailRegistered(email)`. Lowercase + trim del email antes de buscar.

**Archivo**: `backend/src/modules/payments/payments.service.ts`
- Antes de crear el PaymentIntent, si `dto.giftData.recipientEmail` está presente se valida con `isEmailRegistered`. Si no existe, se lanza `BadRequestError` con el mensaje exacto: `"El email del destinatario no corresponde a un usuario registrado en la plataforma."`

**Archivo**: `backend/src/modules/gifts/gifts.service.ts`
- Misma validación en `createGift` (defensa en profundidad para llamadas directas al endpoint `POST /api/gifts`).

**Archivo**: `backend/src/modules/gifts/gifts.types.ts`, `gifts.repository.ts`, `gifts.routes.ts`
- Añadido `recipientEmail?: string` al `CreateGiftDto`, propagado al repositorio, y validado con `z.string().email().optional()` en el schema Zod.

### CHANGE 3: Tres planes de suscripción (BASIC, PRO, PRO_PLUS)

**Archivo**: `backend/src/modules/subscriptions/subscriptions.types.ts`
- Nuevos types `SubscriptionPlanName = 'BASIC' | 'PRO' | 'PRO_PLUS'` y `PaidPlanName = 'PRO' | 'PRO_PLUS'`.
- `CreateSubscriptionDto` ahora acepta `plan?: PaidPlanName` (default 'PRO' por compatibilidad).
- Constante exportada `PLAN_PRICING`: PRO = $9.99/mes (999 cents), PRO_PLUS = $19.99/mes (1999 cents).

**Archivo**: `backend/src/modules/subscriptions/subscriptions.service.ts`
- `getSubscriptionStatus` retorna `SubscriptionPlanName` correcto.
- `createSubscription(userId, dto)` lee `dto.plan` (default 'PRO'), valida que sea PRO o PRO_PLUS, lanza error si el usuario ya tiene ese mismo plan, crea precio inline con el monto y nombre del plan correctos. Embedde `metadata: { userId, plan }` en la suscripción de Stripe para que el webhook pueda recuperar el plan exacto.
- `cancelSubscription` regresa al usuario y a su `Subscription` al plan `'BASIC'` (no `'FREE'`).

**Archivo**: `backend/src/modules/subscriptions/subscriptions.routes.ts`
- Validación Zod: `paymentMethodId: z.string().min(1)`, `plan: z.enum(['PRO', 'PRO_PLUS']).optional()`.

**Archivo**: `backend/src/modules/payments/payments.service.ts`
- Reemplazada la comisión 2.5% por una **tarifa de envío plana de $0.99 (`BASIC_SENDING_FEE`)** para usuarios con plan `BASIC`. Para `PRO` y `PRO_PLUS` no hay tarifa ni comisión.
- El campo `commission` se mantiene en el response y en `pi.metadata` (con valor igual a `sendingFee`) por compatibilidad con la BD y el webhook handler existente.
- Webhook `customer.subscription.created/updated`: ahora lee `sub.metadata.plan` (default 'PRO') para distinguir PRO vs PRO_PLUS al activar; al desactivar regresa a `'BASIC'`.
- Webhook `customer.subscription.deleted`: regresa al usuario a `'BASIC'`.
- Mensaje de error de límite de regalos actualizado: `"Has alcanzado el límite de 5 regalos del plan BASIC..."`

**Archivo**: `backend/src/modules/payments/payments.types.ts`
- `PaymentIntentResponse` ahora incluye `sendingFee: number` (además del `commission` legacy).

### CHANGE 4: Portfolio overview endpoint

**Archivo**: `backend/src/modules/portfolio/portfolio.types.ts`
- Nuevas interfaces `PortfolioInvestmentItem` y `PortfolioOverviewResponse`.

**Archivo**: `backend/src/modules/portfolio/portfolio.service.ts`
- Nueva función `getPortfolioOverview(userId)`. Carga todos los gifts del sender, filtra por `status === 'INVESTED'` para los items, calcula `currentValue = amount * (1 + changePercent / 100)` usando el catálogo mock de `etfs.service` (`getAllETFs` indexado en un Map), retorna `totalBalance`, `totalGifted` (suma de todos los regalos enviados, no solo invertidos), `investments[]`, y `overallChangePercent` (cambio ponderado).

**Archivo**: `backend/src/modules/portfolio/portfolio.controller.ts`
- Nuevo handler `getOverviewHandler`.

**Archivo**: `backend/src/modules/portfolio/portfolio.routes.ts`
- Ruta `GET /overview` registrada **antes** de `GET /:giftId` para evitar conflicto de matching.

### Comandos a ejecutar (manual - el sandbox no tiene node/npm)

```bash
cd /home/camilo/Alpaca_gift_app/backend

# 1. Aplicar la migración (la SQL ya está escrita; Prisma solo la registra y genera el cliente)
npx prisma migrate dev --name "add_etf_ratings_three_plans" --skip-seed

# 2. Verificar tipos
npx tsc --noEmit
```

> **Nota**: La migración SQL ya está pre-escrita en `backend/prisma/migrations/20260429120000_add_etf_ratings_three_plans/migration.sql`. Prisma debería detectarla como migración pendiente y aplicarla. Si por algún motivo se quiere que Prisma la regenere, se puede borrar la carpeta y dejar que `prisma migrate dev` proponga el SQL automáticamente — pero **el SQL auto-generado romperá el rename FREE -> BASIC** porque Prisma trataría el cambio como DROP+CREATE de enum, perdiendo datos. La migración manual preserva los registros existentes.

### Nuevos endpoints API

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| POST   | `/api/etf-ratings/:symbol`        | Bearer JWT | `{ stars: 1-5, comment?: string }`                     | `RatingResponse` (201) |
| GET    | `/api/etf-ratings/:symbol`        | Optional Bearer | -                                                  | `{ ratings, averageStars, totalCount, userRating }` |
| GET    | `/api/portfolio/overview`         | Bearer JWT | -                                                       | `PortfolioOverviewResponse` (ver abajo) |

### Endpoints modificados

| Method | Path | Cambio |
|--------|------|--------|
| POST | `/api/payments/create-intent` | Acepta `recipientEmail` en `giftData`; lo valida contra usuarios registrados antes de crear el PaymentIntent. Response añade `sendingFee`. Para BASIC users `commission === sendingFee === 0.99`. Para PRO/PRO_PLUS ambos son 0. |
| POST | `/api/gifts` | Acepta `recipientEmail` opcional (validado con `z.email()`); si está presente debe corresponder a un usuario registrado. |
| POST | `/api/subscriptions` | Acepta `plan: 'PRO' \| 'PRO_PLUS'` opcional (default 'PRO'). PRO_PLUS factura $19.99/mes; PRO factura $9.99/mes. |
| GET / DELETE | `/api/subscriptions` | El `plan` retornado puede ser `BASIC \| PRO \| PRO_PLUS`. Cancelar regresa al estado `BASIC`. |

### Shapes de respuesta nuevos

**`RatingResponse`**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "userName": "string",
  "etfSymbol": "VOO",
  "stars": 5,
  "comment": "string | null",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

**`GET /api/etf-ratings/:symbol` response**:
```json
{
  "ratings": [RatingResponse, ...],
  "averageStars": 4.32,
  "totalCount": 15,
  "userRating": RatingResponse | null
}
```

**`PortfolioOverviewResponse`**:
```json
{
  "totalBalance": 1234.56,
  "totalGifted": 1500.00,
  "investments": [
    {
      "giftId": "uuid",
      "recipientName": "Maria",
      "etfSymbol": "VOO",
      "etfName": "Vanguard S&P 500 ETF",
      "amount": 100.00,
      "currentValue": 101.23,
      "changePercent": 1.23,
      "changeAmount": 1.23,
      "status": "INVESTED"
    }
  ],
  "overallChangePercent": 1.23
}
```

**`PaymentIntentResponse`** (modificado, añadido `sendingFee`):
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "amount": 100.00,
  "commission": 0.99,
  "sendingFee": 0.99,
  "total": 100.99
}
```

### Resumen de planes de suscripción

| Plan | Precio mensual | Tarifa por regalo | Límite de regalos | Detalles |
|------|---------------|-------------------|-------------------|----------|
| BASIC | Gratis | $0.99 (tarifa de envío) | 5 | Plan gratuito (renombrado de FREE) |
| PRO | $9.99 | Sin tarifa | Ilimitado | - |
| PRO_PLUS | $19.99 | Sin tarifa | Ilimitado | Soporte prioritario |

---

## [2026-04-05] - [SCHEMA PRISMA] + [MIGRACIÓN] + [NUEVO MÓDULO] x3 + [MODIFICACIÓN]

**Acción**: Implementación completa de Stripe Payments, Subscriptions y Recipient portfolio -- módulos nuevos para monetización y experiencia del destinatario.

**Archivos afectados**:

### Schema y Migración
- `backend/prisma/schema.prisma` - Schema actualizado con modelos Subscription, Payment, enums SubscriptionStatus, SubscriptionPlan, PaymentStatus. Campos nuevos en User (subscriptionStatus, stripeCustomerId) y Gift (commission, paymentIntentId, recipientEmail). GiftStatus enum ahora incluye REDEEMED.
- `backend/prisma/migrations/20260405055251_add_payments_subscriptions_recipient/migration.sql` - Migración SQL para los nuevos modelos y columnas.

### Módulo Payments (`src/modules/payments/`)
- `payments.types.ts` - Interfaces CreatePaymentIntentDto y PaymentIntentResponse
- `payments.service.ts` - Lógica de creación de PaymentIntent con comisión 2.5% (plan FREE), límite de 5 regalos para plan FREE, webhook handler para payment_intent.succeeded/failed, customer.subscription.created/updated/deleted, invoice.payment_succeeded/failed. Crea Gift + Payment al recibir pago exitoso via webhook.
- `payments.controller.ts` - Handlers para createPaymentIntent y webhook
- `payments.routes.ts` - POST /webhook (raw body), POST /create-intent (auth required)

### Módulo Subscriptions (`src/modules/subscriptions/`)
- `subscriptions.types.ts` - Interfaces CreateSubscriptionDto y SubscriptionStatusResponse
- `subscriptions.service.ts` - CRUD de suscripciones PRO ($9.99/mes) via Stripe: getStatus, create (attach payment method, create price, create subscription), cancel. Gestión de Stripe Customer.
- `subscriptions.controller.ts` - Handlers para get/create/cancel
- `subscriptions.routes.ts` - GET / (status), POST / (create), DELETE / (cancel), todos con auth

### Módulo Recipient (`src/modules/recipient/`)
- `recipient.types.ts` - Interfaces RecipientTransaction, RecipientPortfolioResponse, SellRequestDto, SellResponse
- `recipient.service.ts` - Portfolio del destinatario via claimToken (sin auth), historial de precios, venta de inversión (marca gift como REDEEMED). Usa alpacaService.getPortfolio para snapshots.
- `recipient.controller.ts` - Handlers para portfolio, history y sell
- `recipient.routes.ts` - GET /portfolio/:claimToken, GET /portfolio/:claimToken/history, POST /portfolio/:claimToken/sell (públicos, sin auth)

### Modificaciones a archivos existentes
- `backend/src/app.ts` - Añadido express.raw() para webhook de Stripe ANTES de express.json(). Importados y montados 3 nuevos routers: /api/payments, /api/subscriptions, /api/recipient.
- `backend/src/modules/gifts/gifts.types.ts` - Añadido REDEEMED al mapa de transiciones válidas (INVESTED -> REDEEMED).

**Detalles**:
- Stripe v22.0.0 usa un patrón de constructor diferente (función, no clase). Se usa `require('stripe')` en lugar de `import Stripe from 'stripe'` + `new Stripe()` para compatibilidad. Los tipos de eventos webhook se anotan como `any` para evitar conflictos con la API de tipos de v22.
- El webhook de Stripe requiere raw body, por lo que `express.raw({ type: 'application/json' })` se monta en `/api/payments/webhook` ANTES de `express.json()`.
- El módulo recipient es público (sin auth) -- los endpoints se acceden via claimToken, que es un UUID único por regalo. Esto permite a los destinatarios ver su portfolio sin crear cuenta.
- Plan FREE: 5 regalos máximo, comisión 2.5%. Plan PRO: ilimitado, sin comisión.
- La migración se sincronizó con el estado existente de la BD (la migración ya había sido aplicada previamente, se recreó el archivo SQL local).

**Comandos ejecutados**:
```bash
npx prisma migrate status
npx prisma generate
npm run build
```

**Nuevos endpoints API**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create-intent` | Bearer JWT | Crea PaymentIntent de Stripe con comisión calculada |
| POST | `/api/payments/webhook` | No (Stripe sig) | Webhook de Stripe para procesar pagos y suscripciones |
| GET | `/api/subscriptions` | Bearer JWT | Estado de suscripción del usuario |
| POST | `/api/subscriptions` | Bearer JWT | Crear suscripción PRO ($9.99/mes) |
| DELETE | `/api/subscriptions` | Bearer JWT | Cancelar suscripción PRO |
| GET | `/api/recipient/portfolio/:claimToken` | No | Portfolio del destinatario |
| GET | `/api/recipient/portfolio/:claimToken/history` | No | Historial de precios |
| POST | `/api/recipient/portfolio/:claimToken/sell` | No | Vender inversión (redeem) |

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
