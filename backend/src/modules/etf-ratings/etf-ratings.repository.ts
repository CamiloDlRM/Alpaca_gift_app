import { prisma } from '../../shared/db/prisma.client';

export async function upsertRating(
  userId: string,
  etfSymbol: string,
  stars: number,
  comment?: string | null
) {
  const symbol = etfSymbol.toUpperCase();
  return prisma.eTFRating.upsert({
    where: { userId_etfSymbol: { userId, etfSymbol: symbol } },
    create: {
      userId,
      etfSymbol: symbol,
      stars,
      comment: comment ?? null,
    },
    update: {
      stars,
      comment: comment ?? null,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function findByETF(etfSymbol: string) {
  return prisma.eTFRating.findMany({
    where: { etfSymbol: etfSymbol.toUpperCase() },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function findByUserAndETF(userId: string, etfSymbol: string) {
  return prisma.eTFRating.findUnique({
    where: { userId_etfSymbol: { userId, etfSymbol: etfSymbol.toUpperCase() } },
    include: { user: { select: { id: true, name: true } } },
  });
}
