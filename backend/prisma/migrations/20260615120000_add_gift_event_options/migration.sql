-- CreateTable
CREATE TABLE "GiftEventOption" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "etfSymbol" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GiftEventOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftEventOption_eventId_idx" ON "GiftEventOption"("eventId");

-- AddForeignKey
ALTER TABLE "GiftEventOption" ADD CONSTRAINT "GiftEventOption_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "GiftEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing events: create one option per existing event
INSERT INTO "GiftEventOption" ("id", "eventId", "etfSymbol", "targetAmount")
SELECT gen_random_uuid()::text, "id", "etfSymbol", "targetAmount" FROM "GiftEvent";
