"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolio = getPortfolio;
exports.getPriceHistory = getPriceHistory;
const prisma_client_1 = require("../../shared/db/prisma.client");
const alpaca_service_1 = require("../alpaca/alpaca.service");
const http_errors_1 = require("../../shared/errors/http-errors");
async function getPortfolio(giftId, userId) {
    const gift = await prisma_client_1.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    const accountId = gift.alpacaAccountId || `mock-${giftId}`;
    const snapshot = await alpaca_service_1.alpacaService.getPortfolio(accountId);
    return {
        giftId,
        ...snapshot,
        symbol: gift.etfSymbol,
    };
}
async function getPriceHistory(giftId, period) {
    const gift = await prisma_client_1.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift)
        throw new http_errors_1.NotFoundError('Gift not found');
    const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';
    const data = await alpaca_service_1.alpacaService.getPriceHistory(gift.etfSymbol, validPeriod);
    return { period: validPeriod, data };
}
//# sourceMappingURL=portfolio.service.js.map