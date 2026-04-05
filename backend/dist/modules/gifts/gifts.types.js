"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = void 0;
exports.VALID_TRANSITIONS = {
    PENDING: ['CLAIMING'],
    CLAIMING: ['KYC_SUBMITTED'],
    KYC_SUBMITTED: ['KYC_VERIFIED'],
    KYC_VERIFIED: ['AGREEMENT_SIGNED'],
    AGREEMENT_SIGNED: ['ACCOUNT_CREATING'],
    ACCOUNT_CREATING: ['INVESTED', 'FAILED'],
    INVESTED: ['REDEEMED'],
    FAILED: [],
    REDEEMED: [],
};
//# sourceMappingURL=gifts.types.js.map