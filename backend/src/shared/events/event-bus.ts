import EventEmitter from 'events';

class EventBus extends EventEmitter {
  emit<T>(event: string, payload: T): boolean {
    return super.emit(event, payload);
  }
  on<T>(event: string, listener: (payload: T) => void): this {
    return super.on(event, listener);
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  GIFT_CREATED:     'gift.created',
  GIFT_CLAIMED:     'gift.claimed',
  KYC_VERIFIED:     'kyc.verified',
  AGREEMENT_SIGNED: 'agreement.signed',
  ACCOUNT_CREATED:  'alpaca.account_created',
  ETF_PURCHASED:    'alpaca.etf_purchased',
} as const;
