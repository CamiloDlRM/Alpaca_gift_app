export type SubscriptionPlanName = 'BASIC' | 'PRO' | 'PRO_PLUS';
export type PaidPlanName = 'PRO' | 'PRO_PLUS';

export interface CreateSubscriptionDto {
  paymentMethodId: string;
  plan?: PaidPlanName;
  billingInterval?: 'month' | 'year';
}

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlanName;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId?: string | null;
}

/** Future Builder (PRO): $39/year */
export const PRO_ANNUAL_PRICE_CENTS = 3900;
/** Visionary (PRO_PLUS): $69/year */
export const PRO_PLUS_ANNUAL_PRICE_CENTS = 6900;

export const PLAN_PRICING: Record<PaidPlanName, { unitAmountCents: number; productName: string; annualPriceUsd: number }> = {
  PRO: {
    unitAmountCents: PRO_ANNUAL_PRICE_CENTS,
    productName: 'WealthGift Future Builder',
    annualPriceUsd: 39,
  },
  PRO_PLUS: {
    unitAmountCents: PRO_PLUS_ANNUAL_PRICE_CENTS,
    productName: 'WealthGift Visionary',
    annualPriceUsd: 69,
  },
};
