-- Performance indexes: all CREATE INDEX IF NOT EXISTS so it is safe to re-run.

-- Gift: the three most-queried columns
CREATE INDEX IF NOT EXISTS "Gift_senderId_idx"       ON "Gift"("senderId");
CREATE INDEX IF NOT EXISTS "Gift_recipientEmail_idx" ON "Gift"("recipientEmail");
CREATE INDEX IF NOT EXISTS "Gift_status_idx"         ON "Gift"("status");
CREATE INDEX IF NOT EXISTS "Gift_deliveryDate_idx"   ON "Gift"("deliveryDate");

-- User: Stripe webhook lookups
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- ImportantDate: list by owner
CREATE INDEX IF NOT EXISTS "ImportantDate_userId_idx" ON "ImportantDate"("userId");

-- FavoriteSchedule: join from FavoriteRecipient
CREATE INDEX IF NOT EXISTS "FavoriteSchedule_favoriteRecipientId_idx" ON "FavoriteSchedule"("favoriteRecipientId");

-- GiftEvent: list by creator
CREATE INDEX IF NOT EXISTS "GiftEvent_creatorId_idx" ON "GiftEvent"("creatorId");

-- GiftEventParticipant: find all events a user is invited to
CREATE INDEX IF NOT EXISTS "GiftEventParticipant_email_idx"   ON "GiftEventParticipant"("email");
CREATE INDEX IF NOT EXISTS "GiftEventParticipant_eventId_idx" ON "GiftEventParticipant"("eventId");
