import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, ForbiddenError } from '../../shared/errors/http-errors';

export interface CreateImportantDateDto {
  personName: string;
  personEmail?: string;
  label: string;
  month: number;
  day: number;
  remindDaysBefore?: number;
}

export async function listImportantDates(userId: string) {
  return prisma.importantDate.findMany({
    where: { userId },
    orderBy: [{ month: 'asc' }, { day: 'asc' }],
  });
}

export async function createImportantDate(userId: string, dto: CreateImportantDateDto) {
  return prisma.importantDate.create({
    data: {
      userId,
      personName: dto.personName,
      personEmail: dto.personEmail ?? null,
      label: dto.label,
      month: dto.month,
      day: dto.day,
      remindDaysBefore: dto.remindDaysBefore ?? 7,
    },
  });
}

export async function deleteImportantDate(id: string, userId: string): Promise<void> {
  const date = await prisma.importantDate.findUnique({ where: { id } });
  if (!date) throw new NotFoundError('Important date not found');
  if (date.userId !== userId) throw new ForbiddenError();

  await prisma.importantDate.delete({ where: { id } });
}
