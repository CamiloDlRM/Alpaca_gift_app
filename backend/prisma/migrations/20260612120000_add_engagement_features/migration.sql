-- AlterEnum
ALTER TYPE "GiftStatus" ADD VALUE 'CANCELLED';

-- CreateEnum
CREATE TYPE "GiftEventStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'GIFTED');

-- AlterTable
ALTER TABLE "Gift" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledReason" TEXT;

-- CreateTable
CREATE TABLE "SavedRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantDate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "personEmail" TEXT,
    "label" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "remindDaysBefore" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportantDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "etfSymbol" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteSchedule" (
    "id" TEXT NOT NULL,
    "favoriteRecipientId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "label" TEXT,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftEvent" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "etfSymbol" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "status" "GiftEventStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftEventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "giftId" TEXT,
    "inviteToken" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftEventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedRecipient_userId_email_key" ON "SavedRecipient"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteRecipient_userId_recipientEmail_key" ON "FavoriteRecipient"("userId", "recipientEmail");

-- CreateIndex
CREATE UNIQUE INDEX "GiftEventParticipant_giftId_key" ON "GiftEventParticipant"("giftId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftEventParticipant_inviteToken_key" ON "GiftEventParticipant"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "GiftEventParticipant_eventId_email_key" ON "GiftEventParticipant"("eventId", "email");

-- AddForeignKey
ALTER TABLE "SavedRecipient" ADD CONSTRAINT "SavedRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportantDate" ADD CONSTRAINT "ImportantDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipient" ADD CONSTRAINT "FavoriteRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSchedule" ADD CONSTRAINT "FavoriteSchedule_favoriteRecipientId_fkey" FOREIGN KEY ("favoriteRecipientId") REFERENCES "FavoriteRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftEventParticipant" ADD CONSTRAINT "GiftEventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GiftEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
