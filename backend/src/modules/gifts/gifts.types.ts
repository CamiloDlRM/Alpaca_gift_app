import { GiftStatus } from '@prisma/client';

export interface CreateGiftDto {
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  note?: string;
  deliveryDate: string;
  recipientEmail?: string;
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
  recipientEmail?: string | null;
  claimPin?: string | null;
  claimPinExpiry?: Date | null;
}

export const VALID_TRANSITIONS: Record<GiftStatus, GiftStatus[]> = {
  PENDING: ['CLAIMING'],
  CLAIMING: ['KYC_SUBMITTED'],
  KYC_SUBMITTED: ['KYC_VERIFIED'],
  KYC_VERIFIED: ['AGREEMENT_SIGNED'],
  AGREEMENT_SIGNED: ['ACCOUNT_CREATING'],
  ACCOUNT_CREATING: ['INVESTED', 'FAILED'],
  INVESTED: ['REDEEMED'],
  FAILED: [],
  REDEEMED: [],
};
