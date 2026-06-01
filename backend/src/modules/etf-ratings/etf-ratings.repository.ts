import { prisma } from '../../shared/db/prisma.client';
import type { RatingRole } from './etf-ratings.types';

export async function upsertRating(
  userId: string,
  etfSymbol: string,
  stars: number,
  role: RatingRole,
  comment?: string | null
) {
  const symbol = etfSymbol.toUpperCase();
  return prisma.eTFRating.upsert({
    where: { userId_etfSymbol_role: { userId, etfSymbol: symbol, role } },
    create: {
      userId,
      etfSymbol: symbol,
      stars,
      role,
      comment: comment ?? null,
    },
    update: {
      stars,
      comment: comment ?? null,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function findByETF(
  etfSymbol: string,
  roleFilter?: RatingRole
) {
  return prisma.eTFRating.findMany({
    where: {
      etfSymbol: etfSymbol.toUpperCase(),
      ...(roleFilter ? { role: roleFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function findByUserAndETF(
  userId: string,
  etfSymbol: string,
  role: RatingRole
) {
  return prisma.eTFRating.findUnique({
    where: {
      userId_etfSymbol_role: { userId, etfSymbol: etfSymbol.toUpperCase(), role },
    },
    include: { user: { select: { id: true, name: true } } },
  });
}
