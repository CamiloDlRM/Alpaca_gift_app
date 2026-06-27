// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
import * as giftsRepo from './gifts.repository';
import { prisma } from '../../shared/db/prisma.client';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../../shared/errors/http-errors';
import { GiftStatus } from '@prisma/client';
import { sendGiftCancelledEmail } from '../../shared/email/email.service';
import { VALID_TRANSITIONS, type CreateGiftDto, type GiftResponse } from './gifts.types';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY!);

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function toGiftResponse(gift: any): GiftResponse {
  return {
    ...gift,
    claimLink: `${BASE_URL}/claim/${gift.claimToken}`,
  };
}

export async function createGift(senderId: string, dto: CreateGiftDto): Promise<GiftResponse> {
  // Non-registered recipients are allowed — they receive an invitation email to claim.
  const gift = await giftsRepo.createGift({
    ...dto,
    senderId,
    deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
  });
  eventBus.emit(EVENTS.GIFT_CREATED, { giftId: gift.id });
  return toGiftResponse(gift);
}

export async function listGifts(userId: string): Promise<GiftResponse[]> {
  const gifts = await giftsRepo.findGiftsByUser(userId);
  return gifts.map(toGiftResponse);
}

export async function getGift(id: string, userId: string): Promise<GiftResponse> {
  const gift = await giftsRepo.findGiftById(id);
  if (!gift) throw new NotFoundError('Gift not found');
  if (gift.senderId !== userId) throw new ForbiddenError();
  return toGiftResponse(gift);
}

export async function getGiftByClaimToken(claimToken: string): Promise<GiftResponse> {
  const gift = await giftsRepo.findGiftByClaimToken(claimToken);
  if (!gift) throw new NotFoundError('Gift not found');
  return toGiftResponse(gift);
}

export async function startClaiming(claimToken: string, claimingUserId: string): Promise<GiftResponse> {
  const gift = await giftsRepo.findGiftByClaimToken(claimToken);
  if (!gift) throw new NotFoundError('Gift not found');

  if (claimingUserId === gift.senderId) {
    throw new ForbiddenError('No puedes reclamar tu propio regalo.');
  }

  // If gift has a designated recipient, verify the logged-in user is that recipient
  if (gift.recipientEmail) {
    const claimingUser = await prisma.user.findUnique({ where: { id: claimingUserId } });
    if (!claimingUser || claimingUser.email.toLowerCase() !== gift.recipientEmail.toLowerCase()) {
      throw new ForbiddenError('Este regalo no fue enviado a tu cuenta.');
    }
  }

  // If already CLAIMING the user is resuming after closing the page — idempotent, just return it
  if (gift.status === GiftStatus.CLAIMING) {
    return toGiftResponse(gift);
  }

  const valid = VALID_TRANSITIONS[gift.status];
  if (!valid.includes(GiftStatus.CLAIMING)) {
    throw new ConflictError(`Cannot transition from ${gift.status} to CLAIMING`);
  }

  const updated = await giftsRepo.updateGiftStatus(gift.id, GiftStatus.CLAIMING);
  eventBus.emit(EVENTS.GIFT_CLAIMED, { giftId: gift.id });
  return toGiftResponse(updated);
}

export async function listReceivedGifts(userEmail: string): Promise<GiftResponse[]> {
  const gifts = await giftsRepo.findGiftsByRecipientEmail(userEmail);
  return gifts.map(toGiftResponse);
}

export async function cancelGift(giftId: string, senderId: string, reason?: string): Promise<void> {
  const gift = await giftsRepo.findGiftById(giftId);
  if (!gift) throw new NotFoundError('Gift not found');
  if (gift.senderId !== senderId) throw new ForbiddenError('No puedes cancelar un regalo que no enviaste.');

  // Only PENDING gifts (not yet claimed) can be cancelled by the sender.
  if (gift.status !== GiftStatus.PENDING) {
    throw new ForbiddenError('Este regalo ya está siendo reclamado y no puede cancelarse.');
  }

  // Full Stripe refund of the original payment intent.
  if (gift.paymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: gift.paymentIntentId });
    } catch (err: any) {
      throw new BadRequestError(`No se pudo procesar el reembolso: ${err?.message || 'error desconocido'}`);
    }
  }

  await prisma.gift.update({
    where: { id: gift.id },
    data: {
      status: GiftStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledReason: reason ?? null,
    },
  });

  await prisma.payment.updateMany({
    where: { giftId: gift.id },
    data: { status: 'REFUNDED' },
  });

  // Confirmation email to the sender (best-effort — never block cancellation).
  try {
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (sender) {
      await sendGiftCancelledEmail({
        senderEmail: sender.email,
        senderName: sender.name,
        recipientName: gift.recipientName,
        amount: gift.amount,
        etfSymbol: gift.etfSymbol,
        reason,
      });
    }
  } catch (err) {
    console.error('[gifts] cancellation email failed:', err);
  }
}

export async function transitionStatus(giftId: string, newStatus: GiftStatus, extra?: { alpacaAccountId?: string; alpacaOrderId?: string; purchasePricePerShare?: number }): Promise<void> {
  const gift = await giftsRepo.findGiftById(giftId);
  if (!gift) throw new NotFoundError('Gift not found');

  const valid = VALID_TRANSITIONS[gift.status];
  if (!valid.includes(newStatus)) {
    throw new ConflictError(`Cannot transition from ${gift.status} to ${newStatus}`);
  }

  await giftsRepo.updateGiftStatus(giftId, newStatus, extra);
}
