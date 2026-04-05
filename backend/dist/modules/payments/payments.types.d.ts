export interface CreatePaymentIntentDto {
    giftData: {
        recipientName: string;
        occasion: string;
        etfSymbol: string;
        amount: number;
        note?: string;
        deliveryDate: string;
        recipientEmail?: string;
    };
}
export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    commission: number;
    total: number;
}
//# sourceMappingURL=payments.types.d.ts.map