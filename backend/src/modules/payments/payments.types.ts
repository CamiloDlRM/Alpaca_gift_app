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
  /**
   * Legacy field. For BASIC users this mirrors `sendingFee`. For PRO/PRO_PLUS it is 0.
   */
  commission: number;
  /**
   * Flat $0.99 "tarifa de envío" charged to BASIC users on each gift. 0 for paid plans.
   */
  sendingFee: number;
  total: number;
}
