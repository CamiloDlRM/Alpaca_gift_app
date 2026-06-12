---
name: WealthGift Backend Architecture
description: WealthGift MVP backend - platform to gift ETFs, built with Express+TS+Prisma+PostgreSQL, modular monolith architecture with event-driven claim flow
type: project
---

WealthGift is a platform to gift investment funds (ETFs) to loved ones. The backend is a modular monolith running on Express.js + TypeScript + Prisma + PostgreSQL.

**Why:** MVP for an investment gifting product with Alpaca Broker API integration (mock mode by default).

**How to apply:**
- Modules: auth, gifts, kyc, agreements, portfolio, etfs, etf-ratings, alpaca, notifications, payments, subscriptions, recipient, wealthy, rankings, saved-recipients, important-dates, favorites, gift-events
- Event-driven claim flow: PENDING -> CLAIMING -> KYC_SUBMITTED -> KYC_VERIFIED -> AGREEMENT_SIGNED -> ACCOUNT_CREATING -> INVESTED/FAILED -> REDEEMED. Also PENDING -> CANCELLED (sender cancels, full Stripe refund, payment -> REFUNDED). VALID_TRANSITIONS in gifts.types.ts is the source of truth.
- Alpaca module auto-creates brokerage account and buys ETF on AGREEMENT_SIGNED event
- Backend runs on port 3001, PostgreSQL via Docker Compose on port 5432
- JWT auth with Bearer tokens, Zod validation on all inputs (validate middleware only checks req.body)
- All claim-side endpoints (KYC, agreements, gift claim) are public (no auth required)
- Sender-side endpoints (create gift, list gifts, portfolio) require JWT auth
- Subscription tiers (internal enum BASIC/PRO/PRO_PLUS; display names Momments/Future Builder/Visionary): sending fee is BASIC=$4.99, PRO & PRO_PLUS=$1.5 per gift. Constants BASIC_SENDING_FEE / PRO_SENDING_FEE in payments.service.ts. There is NO gift-count limit anymore.
- Gifts CAN now be sent to non-registered emails. Non-registered recipients get sendGiftInvitationEmail (register link with claimToken+email query params); registered get sendGiftReceivedEmail. The registration check lives in email.listeners.ts and gift-delivery.cron.ts, NOT in the create/payment services.
- verifyEmail() returns an optional claimToken if the just-verified user has a PENDING gift addressed to their email (post-registration claim redirect).
- Wealthy AI has 4 modes: regulations (Groq stream), investments (Gemini+google_search), calculator (Gemini+google_search, ETF compound-growth calculator), portfolio (Groq DeepSeek). Adding a mode = update WealthyMode union, add PROMPT, add chatX(), add case in chatWealthy switch.
- Crons live in src/shared/cron/ and self-register on import (imported in app.ts): gift-delivery.cron (9AM UTC scheduled gift emails), reminders.cron (8AM important-date reminders, 9AM favorite-schedule reminders — reminders only, no auto-charge, idempotent via lastSentAt).
- Sandbox at /home/camilo/Alpaca_gift_app does not have node/npm installed - prisma migrate / tsc must be run by the user from their host shell; write migration SQL by hand under prisma/migrations/&lt;timestamp&gt;_name/migration.sql
