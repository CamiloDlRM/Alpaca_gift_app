import EventEmitter from 'events';
declare class EventBus extends EventEmitter {
    emit<T>(event: string, payload: T): boolean;
    on<T>(event: string, listener: (payload: T) => void): this;
}
export declare const eventBus: EventBus;
export declare const EVENTS: {
    readonly GIFT_CREATED: "gift.created";
    readonly GIFT_CLAIMED: "gift.claimed";
    readonly KYC_VERIFIED: "kyc.verified";
    readonly AGREEMENT_SIGNED: "agreement.signed";
    readonly ACCOUNT_CREATED: "alpaca.account_created";
    readonly ETF_PURCHASED: "alpaca.etf_purchased";
};
export {};
//# sourceMappingURL=event-bus.d.ts.map