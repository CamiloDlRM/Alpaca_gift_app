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

export interface EtfOption {
  etfSymbol: string;
  targetAmount: number;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  etfOptions: EtfOption[];
  participants: ParticipantInput[];
}

const ETF_TICKER_RE = /^[A-Z]{1,10}$/;

export async function createEvent(creatorId: string, dto: CreateEventDto) {
  for (const opt of dto.etfOptions) {
    const symbol = opt.etfSymbol.trim().toUpperCase();
    if (!ETF_TICKER_RE.test(symbol)) {
      throw new BadRequestError(`Invalid ETF symbol: "${opt.etfSymbol}". Must be a valid ticker (e.g. VOO, SPY).`);
    }
    opt.etfSymbol = symbol;
  }

  const creator = await prisma.user.findUniqueOrThrow({ where: { id: creatorId } });

  // Legacy fields kept for backward compatibility — set to first option.
  const firstOption = dto.etfOptions[0];

  const event = await prisma.giftEvent.create({
    data: {
      creatorId,
      title: dto.title,
      description: dto.description ?? null,
      etfSymbol: firstOption.etfSymbol,
      targetAmount: firstOption.targetAmount,
      options: {
        create: dto.etfOptions.map(o => ({
          etfSymbol: o.etfSymbol,
          targetAmount: o.targetAmount,
        })),
      },
      participants: {
        create: dto.participants.map(p => ({
          email: p.email.toLowerCase().trim(),
          name: p.name,
        })),
      },
    },
    include: { participants: true, options: true },
  });

  for (const participant of event.participants) {
    try {
      await sendGiftEventInviteEmail({
        participantEmail: participant.email,
        participantName: participant.name,
        creatorName: creator.name,
        eventTitle: event.title,
        etfSymbol: firstOption.etfSymbol,
        targetAmount: firstOption.targetAmount,
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
    include: { participants: true, options: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listInvitedEvents(userEmail: string) {
  const email = userEmail.toLowerCase().trim();
  const events = await prisma.giftEvent.findMany({
    where: { participants: { some: { email } } },
    include: {
      participants: true,
      options: true,
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return events.map((ev: typeof events[number]) => {
    const { participants, ...rest } = ev;
    return {
      ...rest,
      participant: participants.find((p: typeof participants[number]) => p.email === email)!,
    };
  });
}

export async function getEventByInviteToken(inviteToken: string) {
  const participant = await prisma.giftEventParticipant.findUnique({
    where: { inviteToken },
    include: {
      event: {
        include: {
          options: true,
          creator: { select: { id: true, name: true, email: true } },
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
