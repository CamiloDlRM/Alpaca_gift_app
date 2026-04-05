import { GiftStatus } from '@prisma/client';
import { type CreateGiftDto, type GiftResponse } from './gifts.types';
export declare function createGift(senderId: string, dto: CreateGiftDto): Promise<GiftResponse>;
export declare function listGifts(userId: string): Promise<GiftResponse[]>;
export declare function getGift(id: string, userId: string): Promise<GiftResponse>;
export declare function getGiftByClaimToken(claimToken: string): Promise<GiftResponse>;
export declare function startClaiming(claimToken: string): Promise<GiftResponse>;
export declare function transitionStatus(giftId: string, newStatus: GiftStatus, extra?: {
    alpacaAccountId?: string;
    alpacaOrderId?: string;
}): Promise<void>;
//# sourceMappingURL=gifts.service.d.ts.map