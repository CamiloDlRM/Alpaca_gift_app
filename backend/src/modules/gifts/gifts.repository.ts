import { prisma } from '../../shared/db/prisma.client';
import { GiftStatus } from '@prisma/client';

export async function createGift(data: {
  senderId: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  note?: string;
  deliveryDate?: Date | null;
  recipientEmail?: string;
}) {
  return prisma.gift.create({ data });
}

export async function markClaimEmailSent(id: string) {
  return prisma.gift.update({ where: { id }, data: { claimEmailSentAt: new Date() } });
}

export async function findGiftsByUser(userId: string) {
  return prisma.gift.findMany({ where: { senderId: userId }, orderBy: { createdAt: 'desc' } });
}

export async function findGiftById(id: string) {
  return prisma.gift.findUnique({ where: { id } });
}

export async function findGiftByClaimToken(claimToken: string) {
  // Include only the sender's display name (never the full user row) so the
  // public claim page can greet the recipient with who sent the gift.
  return prisma.gift.findUnique({
    where: { claimToken },
    include: { sender: { select: { name: true } } },
  });
}

export async function findGiftsByRecipientEmail(email: string) {
  return prisma.gift.findMany({
    where: { recipientEmail: email },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateGiftStatus(id: string, status: GiftStatus, extra?: { alpacaAccountId?: string; alpacaOrderId?: string; purchasePricePerShare?: number }) {
  return prisma.gift.update({ where: { id }, data: { status, ...extra } });
}
