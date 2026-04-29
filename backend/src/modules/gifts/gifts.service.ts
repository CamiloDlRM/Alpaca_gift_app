import * as giftsRepo from './gifts.repository';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../../shared/errors/http-errors';
import { GiftStatus } from '@prisma/client';
import { isEmailRegistered } from '../auth/auth.service';
import { VALID_TRANSITIONS, type CreateGiftDto, type GiftResponse } from './gifts.types';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function toGiftResponse(gift: any): GiftResponse {
  return {
    ...gift,
    claimLink: `${BASE_URL}/claim/${gift.claimToken}`,
  };
}

export async function createGift(senderId: string, dto: CreateGiftDto): Promise<GiftResponse> {
  // Validate that the recipient email (if provided) belongs to a registered user.
  if (dto.recipientEmail) {
    const registered = await isEmailRegistered(dto.recipientEmail);
    if (!registered) {
      throw new BadRequestError(
        'El email del destinatario no corresponde a un usuario registrado en la plataforma.'
      );
    }
  }

  const gift = await giftsRepo.createGift({
    ...dto,
    senderId,
    deliveryDate: new Date(dto.deliveryDate),
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

export async function startClaiming(claimToken: string): Promise<GiftResponse> {
  const gift = await giftsRepo.findGiftByClaimToken(claimToken);
  if (!gift) throw new NotFoundError('Gift not found');

  const valid = VALID_TRANSITIONS[gift.status];
  if (!valid.includes('CLAIMING' as GiftStatus)) {
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

export async function transitionStatus(giftId: string, newStatus: GiftStatus, extra?: { alpacaAccountId?: string; alpacaOrderId?: string }): Promise<void> {
  const gift = await giftsRepo.findGiftById(giftId);
  if (!gift) throw new NotFoundError('Gift not found');

  const valid = VALID_TRANSITIONS[gift.status];
  if (!valid.includes(newStatus)) {
    throw new ConflictError(`Cannot transition from ${gift.status} to ${newStatus}`);
  }

  await giftsRepo.updateGiftStatus(giftId, newStatus, extra);
}
