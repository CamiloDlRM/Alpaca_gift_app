"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGift = createGift;
exports.listGifts = listGifts;
exports.getGift = getGift;
exports.getGiftByClaimToken = getGiftByClaimToken;
exports.startClaiming = startClaiming;
exports.transitionStatus = transitionStatus;
const giftsRepo = __importStar(require("./gifts.repository"));
const event_bus_1 = require("../../shared/events/event-bus");
const http_errors_1 = require("../../shared/errors/http-errors");
const client_1 = require("@prisma/client");
const gifts_types_1 = require("./gifts.types");
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
function toGiftResponse(gift) {
    return {
        ...gift,
        claimLink: `${BASE_URL}/claim/${gift.claimToken}`,
    };
}
async function createGift(senderId, dto) {
    const gift = await giftsRepo.createGift({
        ...dto,
        senderId,
        deliveryDate: new Date(dto.deliveryDate),
    });
    event_bus_1.eventBus.emit(event_bus_1.EVENTS.GIFT_CREATED, { giftId: gift.id });
    return toGiftResponse(gift);
}
async function listGifts(userId) {
    const gifts = await giftsRepo.findGiftsByUser(userId);
    return gifts.map(toGiftResponse);
}
async function getGift(id, userId) {
    const gift = await giftsRepo.findGiftById(id);
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    if (gift.senderId !== userId)
        throw new http_errors_1.ForbiddenError();
    return toGiftResponse(gift);
}
async function getGiftByClaimToken(claimToken) {
    const gift = await giftsRepo.findGiftByClaimToken(claimToken);
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    return toGiftResponse(gift);
}
async function startClaiming(claimToken) {
    const gift = await giftsRepo.findGiftByClaimToken(claimToken);
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    const valid = gifts_types_1.VALID_TRANSITIONS[gift.status];
    if (!valid.includes('CLAIMING')) {
        throw new http_errors_1.ConflictError(`Cannot transition from ${gift.status} to CLAIMING`);
    }
    const updated = await giftsRepo.updateGiftStatus(gift.id, client_1.GiftStatus.CLAIMING);
    event_bus_1.eventBus.emit(event_bus_1.EVENTS.GIFT_CLAIMED, { giftId: gift.id });
    return toGiftResponse(updated);
}
async function transitionStatus(giftId, newStatus, extra) {
    const gift = await giftsRepo.findGiftById(giftId);
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    const valid = gifts_types_1.VALID_TRANSITIONS[gift.status];
    if (!valid.includes(newStatus)) {
        throw new http_errors_1.ConflictError(`Cannot transition from ${gift.status} to ${newStatus}`);
    }
    await giftsRepo.updateGiftStatus(giftId, newStatus, extra);
}
//# sourceMappingURL=gifts.service.js.map