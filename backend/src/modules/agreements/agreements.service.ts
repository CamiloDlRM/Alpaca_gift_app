import { prisma } from '../../shared/db/prisma.client';
import { getGiftByClaimToken as findGiftByClaimToken, transitionStatus } from '../gifts/gifts.service';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { BadRequestError } from '../../shared/errors/http-errors';
import { GiftStatus } from '@prisma/client';
import type { SignAgreementDto } from './agreements.types';

export async function signAgreement(dto: SignAgreementDto) {
  if (!dto.agreed) throw new BadRequestError('Must agree to terms');

  const gift = await findGiftByClaimToken(dto.claimToken);

  const existing = await prisma.agreement.findUnique({ where: { giftId: gift.id } });
  if (existing) throw new BadRequestError('Agreement already signed');

  const agreement = await prisma.agreement.create({
    data: {
      giftId: gift.id,
      signatureBase64: dto.signatureBase64,
      agreedToTerms: true,
    },
  });

  await transitionStatus(gift.id, GiftStatus.AGREEMENT_SIGNED);
  eventBus.emit(EVENTS.AGREEMENT_SIGNED, { giftId: gift.id });

  return agreement;
}
