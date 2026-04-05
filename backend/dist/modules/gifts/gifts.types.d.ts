import { GiftStatus } from '@prisma/client';
export interface CreateGiftDto {
    recipientName: string;
    occasion: string;
    etfSymbol: string;
    amount: number;
    note?: string;
    deliveryDate: string;
}
export interface GiftResponse {
    id: string;
    senderId: string;
    recipientName: string;
    occasion: string;
    etfSymbol: string;
    amount: number;
    note?: string | null;
    deliveryDate: Date;
    status: GiftStatus;
    claimToken: string;
    claimLink: string;
    createdAt: Date;
}
export declare const VALID_TRANSITIONS: Record<GiftStatus, GiftStatus[]>;
//# sourceMappingURL=gifts.types.d.ts.map