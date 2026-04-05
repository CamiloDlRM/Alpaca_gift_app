---
name: WealthGift Backend Architecture
description: WealthGift MVP backend - platform to gift ETFs, built with Express+TS+Prisma+PostgreSQL, modular monolith architecture with event-driven claim flow
type: project
---

WealthGift is a platform to gift investment funds (ETFs) to loved ones. The backend is a modular monolith running on Express.js + TypeScript + Prisma + PostgreSQL.

**Why:** MVP for an investment gifting product with Alpaca Broker API integration (mock mode by default).

**How to apply:**
- 8 modules: auth, gifts, kyc, agreements, portfolio, etfs, alpaca, notifications
- Event-driven claim flow: PENDING -> CLAIMING -> KYC_SUBMITTED -> KYC_VERIFIED -> AGREEMENT_SIGNED -> ACCOUNT_CREATING -> INVESTED/FAILED
- Alpaca module auto-creates brokerage account and buys ETF on AGREEMENT_SIGNED event
- Backend runs on port 3001, PostgreSQL via Docker Compose on port 5432
- JWT auth with Bearer tokens, Zod validation on all inputs
- All claim-side endpoints (KYC, agreements, gift claim) are public (no auth required)
- Sender-side endpoints (create gift, list gifts, portfolio) require JWT auth
