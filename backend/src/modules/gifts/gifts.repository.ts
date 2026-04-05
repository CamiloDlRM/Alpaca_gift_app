import { prisma } from '../../shared/db/prisma.client';
import { GiftStatus } from '@prisma/client';

export async function createGift(data: {
  senderId: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  note?: string;
  deliveryDate: Date;
}) {
  return prisma.gift.create({ data });
}

export async function findGiftsByUser(userId: string) {
  return prisma.gift.findMany({ where: { senderId: userId }, orderBy: { createdAt: 'desc' } });
}

export async function findGiftById(id: string) {
  return prisma.gift.findUnique({ where: { id } });
}

export async function findGiftByClaimToken(claimToken: string) {
  return prisma.gift.findUnique({ where: { claimToken } });
}

export async function updateGiftStatus(id: string, status: GiftStatus, extra?: { alpacaAccountId?: string; alpacaOrderId?: string }) {
  return prisma.gift.update({ where: { id }, data: { status, ...extra } });
}
