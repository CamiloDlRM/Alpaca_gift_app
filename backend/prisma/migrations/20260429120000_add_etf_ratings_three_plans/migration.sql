-- Rename existing FREE values to BASIC and add PRO_PLUS to the SubscriptionStatus and SubscriptionPlan enums.
-- Then create the ETFRating table.

-- Step 1: Drop defaults that reference the enum values about to be renamed.
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP DEFAULT;

-- Step 2: Rename FREE -> BASIC on both enums (preserves existing rows transparently).
ALTER TYPE "SubscriptionStatus" RENAME VALUE 'FREE' TO 'BASIC';
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'FREE' TO 'BASIC';

-- Step 3: Add the new PRO_PLUS variant to both enums.
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PRO_PLUS';
ALTER TYPE "SubscriptionPlan" ADD VALUE 'PRO_PLUS';

-- Step 4: Restore defaults using the new enum value name.
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'BASIC';
ALTER TABLE "Subscription" ALTER COLUMN "plan" SET DEFAULT 'BASIC';

-- Step 5: Create the ETFRating table.
CREATE TABLE "ETFRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "etfSymbol" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ETFRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ETFRating_userId_etfSymbol_key" ON "ETFRating"("userId", "etfSymbol");

-- AddForeignKey
ALTER TABLE "ETFRating" ADD CONSTRAINT "ETFRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
