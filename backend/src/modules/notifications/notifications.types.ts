export interface NotificationPayload {
  type: 'gift_created' | 'gift_claimed' | 'kyc_verified' | 'invested';
  to: string;
  data: Record<string, unknown>;
}
