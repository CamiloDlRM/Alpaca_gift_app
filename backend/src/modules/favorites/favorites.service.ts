import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/http-errors';

export interface FavoriteScheduleInput {
  month: number;
  day: number;
  label?: string;
}

export interface CreateFavoriteDto {
  recipientEmail: string;
  recipientName: string;
  etfSymbol: string;
  amount: number;
  schedules: FavoriteScheduleInput[];
}

export interface UpdateFavoriteDto {
  recipientName?: string;
  etfSymbol?: string;
  amount?: number;
  schedules?: FavoriteScheduleInput[];
}

export async function listFavorites(userId: string) {
  return prisma.favoriteRecipient.findMany({
    where: { userId },
    include: { schedules: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFavorite(userId: string, dto: CreateFavoriteDto) {
  const recipientEmail = dto.recipientEmail.toLowerCase().trim();
  const existing = await prisma.favoriteRecipient.findUnique({
    where: { userId_recipientEmail: { userId, recipientEmail } },
  });
  if (existing) throw new ConflictError('Ya tienes a este destinatario en favoritos.');

  return prisma.favoriteRecipient.create({
    data: {
      userId,
      recipientEmail,
      recipientName: dto.recipientName,
      etfSymbol: dto.etfSymbol,
      amount: dto.amount,
      schedules: {
        create: (dto.schedules ?? []).map(s => ({
          month: s.month,
          day: s.day,
          label: s.label ?? null,
        })),
      },
    },
    include: { schedules: true },
  });
}

export async function updateFavorite(id: string, userId: string, dto: UpdateFavoriteDto) {
  const favorite = await prisma.favoriteRecipient.findUnique({ where: { id } });
  if (!favorite) throw new NotFoundError('Favorite recipient not found');
  if (favorite.userId !== userId) throw new ForbiddenError();

  // When schedules are provided, replace the existing set entirely.
  if (dto.schedules) {
    await prisma.favoriteSchedule.deleteMany({ where: { favoriteRecipientId: id } });
  }

  return prisma.favoriteRecipient.update({
    where: { id },
    data: {
      ...(dto.recipientName !== undefined ? { recipientName: dto.recipientName } : {}),
      ...(dto.etfSymbol !== undefined ? { etfSymbol: dto.etfSymbol } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.schedules
        ? {
            schedules: {
              create: dto.schedules.map(s => ({
                month: s.month,
                day: s.day,
                label: s.label ?? null,
              })),
            },
          }
        : {}),
    },
    include: { schedules: true },
  });
}

export async function deleteFavorite(id: string, userId: string): Promise<void> {
  const favorite = await prisma.favoriteRecipient.findUnique({ where: { id } });
  if (!favorite) throw new NotFoundError('Favorite recipient not found');
  if (favorite.userId !== userId) throw new ForbiddenError();

  await prisma.favoriteRecipient.delete({ where: { id } });
}
