export type SubscriptionPlanName = 'BASIC' | 'PRO' | 'PRO_PLUS';
export type PaidPlanName = 'PRO' | 'PRO_PLUS';

export interface CreateSubscriptionDto {
  paymentMethodId: string;
  /**
   * Which paid plan to subscribe to. Defaults to 'PRO' for backward compatibility.
   */
  plan?: PaidPlanName;
}

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlanName;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId?: string | null;
}

/**
 * Pricing in USD (charged via Stripe in cents).
 */
export const PLAN_PRICING: Record<PaidPlanName, { unitAmountCents: number; productName: string; monthlyPriceUsd: number }> = {
  PRO: {
    unitAmountCents: 999,
    productName: 'WealthGift PRO',
    monthlyPriceUsd: 9.99,
  },
  PRO_PLUS: {
    unitAmountCents: 1999,
    productName: 'WealthGift PRO+',
    monthlyPriceUsd: 19.99,
  },
};
