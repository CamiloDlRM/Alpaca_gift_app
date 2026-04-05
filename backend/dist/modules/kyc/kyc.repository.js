"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKYC = createKYC;
exports.findKYCByGiftId = findKYCByGiftId;
exports.verifyKYC = verifyKYC;
const prisma_client_1 = require("../../shared/db/prisma.client");
async function createKYC(data) {
    return prisma_client_1.prisma.kYC.create({ data });
}
async function findKYCByGiftId(giftId) {
    return prisma_client_1.prisma.kYC.findUnique({ where: { giftId } });
}
async function verifyKYC(id) {
    return prisma_client_1.prisma.kYC.update({
        where: { id },
        data: { verified: true, verifiedAt: new Date() },
    });
}
//# sourceMappingURL=kyc.repository.js.map