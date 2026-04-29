---
name: WealthGift Backend Architecture
description: WealthGift MVP backend - platform to gift ETFs, built with Express+TS+Prisma+PostgreSQL, modular monolith architecture with event-driven claim flow
type: project
---

WealthGift is a platform to gift investment funds (ETFs) to loved ones. The backend is a modular monolith running on Express.js + TypeScript + Prisma + PostgreSQL.

**Why:** MVP for an investment gifting product with Alpaca Broker API integration (mock mode by default).

**How to apply:**
- Modules: auth, gifts, kyc, agreements, portfolio, etfs, etf-ratings, alpaca, notifications, payments, subscriptions, recipient
- Event-driven claim flow: PENDING -> CLAIMING -> KYC_SUBMITTED -> KYC_VERIFIED -> AGREEMENT_SIGNED -> ACCOUNT_CREATING -> INVESTED/FAILED -> REDEEMED
- Alpaca module auto-creates brokerage account and buys ETF on AGREEMENT_SIGNED event
- Backend runs on port 3001, PostgreSQL via Docker Compose on port 5432
- JWT auth with Bearer tokens, Zod validation on all inputs
- All claim-side endpoints (KYC, agreements, gift claim) are public (no auth required)
- Sender-side endpoints (create gift, list gifts, portfolio) require JWT auth
- Subscription tiers: BASIC (free, $0.99 sending fee per gift, max 5 gifts), PRO ($9.99/mo, unlimited, no fees), PRO_PLUS ($19.99/mo, priority support)
- Recipient email on a gift must belong to a registered user (validated in payments and gifts services)
- Sandbox at /home/camilo/Alpaca_gift_app does not have node/npm installed - prisma migrate / tsc must be run by the user from their host shell
