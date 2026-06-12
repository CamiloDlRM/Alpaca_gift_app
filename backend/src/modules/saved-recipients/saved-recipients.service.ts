import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/http-errors';

export interface CreateSavedRecipientDto {
  name: string;
  email: string;
}

export async function listSavedRecipients(userId: string) {
  return prisma.savedRecipient.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSavedRecipient(userId: string, dto: CreateSavedRecipientDto) {
  const email = dto.email.toLowerCase().trim();
  const existing = await prisma.savedRecipient.findUnique({
    where: { userId_email: { userId, email } },
  });
  if (existing) throw new ConflictError('Ya guardaste a este destinatario.');

  return prisma.savedRecipient.create({
    data: { userId, name: dto.name, email },
  });
}

export async function deleteSavedRecipient(id: string, userId: string): Promise<void> {
  const recipient = await prisma.savedRecipient.findUnique({ where: { id } });
  if (!recipient) throw new NotFoundError('Saved recipient not found');
  if (recipient.userId !== userId) throw new ForbiddenError();

  await prisma.savedRecipient.delete({ where: { id } });
}
