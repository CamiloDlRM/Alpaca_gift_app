"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTS = exports.eventBus = void 0;
const events_1 = __importDefault(require("events"));
class EventBus extends events_1.default {
    emit(event, payload) {
        return super.emit(event, payload);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
}
exports.eventBus = new EventBus();
exports.EVENTS = {
    GIFT_CREATED: 'gift.created',
    GIFT_CLAIMED: 'gift.claimed',
    KYC_VERIFIED: 'kyc.verified',
    AGREEMENT_SIGNED: 'agreement.signed',
    ACCOUNT_CREATED: 'alpaca.account_created',
    ETF_PURCHASED: 'alpaca.etf_purchased',
};
//# sourceMappingURL=event-bus.js.map