"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGift = createGift;
exports.findGiftsByUser = findGiftsByUser;
exports.findGiftById = findGiftById;
exports.findGiftByClaimToken = findGiftByClaimToken;
exports.updateGiftStatus = updateGiftStatus;
const prisma_client_1 = require("../../shared/db/prisma.client");
async function createGift(data) {
    return prisma_client_1.prisma.gift.create({ data });
}
async function findGiftsByUser(userId) {
    return prisma_client_1.prisma.gift.findMany({ where: { senderId: userId }, orderBy: { createdAt: 'desc' } });
}
async function findGiftById(id) {
    return prisma_client_1.prisma.gift.findUnique({ where: { id } });
}
async function findGiftByClaimToken(claimToken) {
    return prisma_client_1.prisma.gift.findUnique({ where: { claimToken } });
}
async function updateGiftStatus(id, status, extra) {
    return prisma_client_1.prisma.gift.update({ where: { id }, data: { status, ...extra } });
}
//# sourceMappingURL=gifts.repository.js.map