-- Add redeemedAmount column to Gift to persist the sell proceeds when a gift is redeemed.
ALTER TABLE "Gift" ADD COLUMN "redeemedAmount" DOUBLE PRECISION;
