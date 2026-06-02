-- Add unique constraint to paymentIntentId to prevent duplicate gifts from the same payment
CREATE UNIQUE INDEX "Gift_paymentIntentId_key" ON "Gift"("paymentIntentId");
