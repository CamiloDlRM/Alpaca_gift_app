export interface CreateSubscriptionDto {
    paymentMethodId: string;
}
export interface SubscriptionStatusResponse {
    plan: 'FREE' | 'PRO';
    status: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId?: string | null;
}
//# sourceMappingURL=subscriptions.types.d.ts.map