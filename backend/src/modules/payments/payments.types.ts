export interface CreatePaymentIntentDto {
  giftData: {
    recipientName: string;
    occasion: string;
    etfSymbol: string;
    amount: number;
    note?: string;
    deliveryDate?: string;
    recipientEmail?: string;
  };
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  /** Legacy field kept for backward compatibility. Mirrors sendingFee. */
  commission: number;
  /** Sending fee per plan: $4.99 (Momments/BASIC), $1.50 (Future Builder/PRO), $1.00 (Visionary/PRO_PLUS). */
  sendingFee: number;
  total: number;
}
