-- CreateEnum
CREATE TYPE "RatingRole" AS ENUM ('SENDER', 'RECEIVER');

-- AlterTable
ALTER TABLE "ETFRating" ADD COLUMN "role" "RatingRole" NOT NULL DEFAULT 'SENDER';

-- DropIndex
DROP INDEX "ETFRating_userId_etfSymbol_key";

-- CreateIndex
CREATE UNIQUE INDEX "ETFRating_userId_etfSymbol_role_key" ON "ETFRating"("userId", "etfSymbol", "role");
