import { CreateSubscriptionDto, SubscriptionStatusResponse } from './subscriptions.types';
export declare function getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse>;
export declare function createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionStatusResponse>;
export declare function cancelSubscription(userId: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=subscriptions.service.d.ts.map