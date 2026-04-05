import { CreatePaymentIntentDto, PaymentIntentResponse } from './payments.types';
export declare function createPaymentIntent(userId: string, dto: CreatePaymentIntentDto): Promise<PaymentIntentResponse>;
export declare function handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
//# sourceMappingURL=payments.service.d.ts.map