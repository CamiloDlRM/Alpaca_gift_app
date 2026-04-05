"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAgreement = signAgreement;
const prisma_client_1 = require("../../shared/db/prisma.client");
const gifts_service_1 = require("../gifts/gifts.service");
const event_bus_1 = require("../../shared/events/event-bus");
const http_errors_1 = require("../../shared/errors/http-errors");
const client_1 = require("@prisma/client");
async function signAgreement(dto) {
    if (!dto.agreed)
        throw new http_errors_1.BadRequestError('Must agree to terms');
    const gift = await (0, gifts_service_1.getGiftByClaimToken)(dto.claimToken);
    const existing = await prisma_client_1.prisma.agreement.findUnique({ where: { giftId: gift.id } });
    if (existing)
        throw new http_errors_1.BadRequestError('Agreement already signed');
    const agreement = await prisma_client_1.prisma.agreement.create({
        data: {
            giftId: gift.id,
            signatureBase64: dto.signatureBase64,
            agreedToTerms: true,
        },
    });
    await (0, gifts_service_1.transitionStatus)(gift.id, client_1.GiftStatus.AGREEMENT_SIGNED);
    event_bus_1.eventBus.emit(event_bus_1.EVENTS.AGREEMENT_SIGNED, { giftId: gift.id });
    return agreement;
}
//# sourceMappingURL=agreements.service.js.map