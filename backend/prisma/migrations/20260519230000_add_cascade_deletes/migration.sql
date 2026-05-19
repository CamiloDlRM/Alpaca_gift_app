-- Add onDelete: Cascade to all foreign keys that reference User and Gift

-- Gift → User (senderId)
ALTER TABLE "Gift" DROP CONSTRAINT "Gift_senderId_fkey";
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription → User (userId)
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ETFRating → User (userId)
ALTER TABLE "ETFRating" DROP CONSTRAINT "ETFRating_userId_fkey";
ALTER TABLE "ETFRating" ADD CONSTRAINT "ETFRating_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- KYC → Gift (giftId)
ALTER TABLE "KYC" DROP CONSTRAINT "KYC_giftId_fkey";
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_giftId_fkey"
  FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Agreement → Gift (giftId)
ALTER TABLE "Agreement" DROP CONSTRAINT "Agreement_giftId_fkey";
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_giftId_fkey"
  FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment → Gift (giftId)
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_giftId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_giftId_fkey"
  FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
