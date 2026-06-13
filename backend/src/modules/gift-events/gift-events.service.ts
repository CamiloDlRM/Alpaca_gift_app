import { prisma } from '../../shared/db/prisma.client';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../shared/errors/http-errors';
import { sendGiftEventInviteEmail } from '../../shared/email/email.service';

export interface ParticipantInput {
  email: string;
  name: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  etfSymbol: string;
  targetAmount: number;
  participants: ParticipantInput[];
}

export async function createEvent(creatorId: string, dto: CreateEventDto) {
  if (!/^[A-Z]{1,10}$/.test(dto.etfSymbol.trim().toUpperCase())) {
    throw new BadRequestError('ETF symbol must be a single valid ticker (e.g. VOO, SPY).');
  }
  dto.etfSymbol = dto.etfSymbol.trim().toUpperCase();

  const creator = await prisma.user.findUniqueOrThrow({ where: { id: creatorId } });

  const event = await prisma.giftEvent.create({
    data: {
      creatorId,
      title: dto.title,
      description: dto.description ?? null,
      etfSymbol: dto.etfSymbol,
      targetAmount: dto.targetAmount,
      participants: {
        create: dto.participants.map(p => ({
          email: p.email.toLowerCase().trim(),
          name: p.name,
        })),
      },
    },
    include: { participants: true },
  });

  // Send invitation emails (best-effort — one failure must not roll back the event).
  for (const participant of event.participants) {
    try {
      await sendGiftEventInviteEmail({
        participantEmail: participant.email,
        participantName: participant.name,
        creatorName: creator.name,
        eventTitle: event.title,
        etfSymbol: event.etfSymbol,
        targetAmount: event.targetAmount,
        inviteToken: participant.inviteToken,
      });
    } catch (err) {
      console.error(`[gift-events] invite email failed for ${participant.email}:`, err);
    }
  }

  return event;
}

export async function listMyEvents(userId: string) {
  return prisma.giftEvent.findMany({
    where: { creatorId: userId },
    include: { participants: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listInvitedEvents(userEmail: string) {
  const email = userEmail.toLowerCase().trim();
  return prisma.giftEvent.findMany({
    where: { participants: { some: { email } } },
    include: { participants: true, creator: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEventByInviteToken(inviteToken: string) {
  const participant = await prisma.giftEventParticipant.findUnique({
    where: { inviteToken },
    include: {
      event: {
        include: {
          participants: true,
          creator: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!participant) throw new NotFoundError('Invitation not found');
  return { participant, event: participant.event };
}

export async function acceptEventInvitation(inviteToken: string) {
  const participant = await prisma.giftEventParticipant.findUnique({ where: { inviteToken } });
  if (!participant) throw new NotFoundError('Invitation not found');

  return prisma.giftEventParticipant.update({
    where: { inviteToken },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });
}

export async function declineEventInvitation(inviteToken: string) {
  const participant = await prisma.giftEventParticipant.findUnique({ where: { inviteToken } });
  if (!participant) throw new NotFoundError('Invitation not found');

  return prisma.giftEventParticipant.update({
    where: { inviteToken },
    data: { status: 'DECLINED' },
  });
}

export async function linkGiftToEvent(inviteToken: string, giftId: string) {
  const participant = await prisma.giftEventParticipant.findUnique({ where: { inviteToken } });
  if (!participant) throw new NotFoundError('Invitation not found');

  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) throw new NotFoundError('Gift not found');

  const alreadyLinked = await prisma.giftEventParticipant.findUnique({ where: { giftId } });
  if (alreadyLinked && alreadyLinked.id !== participant.id) {
    throw new ConflictError('Este regalo ya está vinculado a otra invitación.');
  }

  return prisma.giftEventParticipant.update({
    where: { inviteToken },
    data: { status: 'GIFTED', giftId },
  });
}

export async function closeEvent(eventId: string, creatorId: string) {
  const event = await prisma.giftEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Event not found');
  if (event.creatorId !== creatorId) throw new ForbiddenError();

  return prisma.giftEvent.update({
    where: { id: eventId },
    data: { status: 'CLOSED' },
  });
}
