"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipientPortfolio = getRecipientPortfolio;
exports.getRecipientHistory = getRecipientHistory;
exports.sellRecipientInvestment = sellRecipientInvestment;
const prisma_client_1 = require("../../shared/db/prisma.client");
const http_errors_1 = require("../../shared/errors/http-errors");
const alpaca_service_1 = require("../alpaca/alpaca.service");
async function getRecipientPortfolio(claimToken) {
    const gift = await prisma_client_1.prisma.gift.findUnique({ where: { claimToken } });
    if (!gift)
        throw new http_errors_1.NotFoundError('Regalo no encontrado.');
    if (gift.status !== 'INVESTED' && gift.status !== 'REDEEMED') {
        throw new http_errors_1.BadRequestError('Este regalo aún no está invertido.');
    }
    const accountId = gift.alpacaAccountId || `mock-${gift.id}`;
    const snapshot = await alpaca_service_1.alpacaService.getPortfolio(accountId);
    const investedAt = gift.updatedAt.toISOString();
    const pricePerShare = snapshot.shares > 0 ? snapshot.totalValue / snapshot.shares : 0;
    const transactions = [
        {
            date: investedAt,
            type: 'BUY',
            shares: snapshot.shares,
            pricePerShare,
            total: gift.amount,
        },
    ];
    return {
        giftId: gift.id,
        recipientName: gift.recipientName,
        etfSymbol: gift.etfSymbol,
        occasion: gift.occasion,
        totalValue: snapshot.totalValue,
        gainLoss: snapshot.gainLoss,
        gainLossPercent: snapshot.gainLossPercent,
        shares: snapshot.shares,
        investedAt,
        isRedeemed: gift.status === 'REDEEMED',
        transactions,
    };
}
async function getRecipientHistory(claimToken, period) {
    const gift = await prisma_client_1.prisma.gift.findUnique({ where: { claimToken } });
    if (!gift)
        throw new http_errors_1.NotFoundError('Regalo no encontrado.');
    const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';
    const data = await alpaca_service_1.alpacaService.getPriceHistory(gift.etfSymbol, validPeriod);
    return { period: validPeriod, data };
}
async function sellRecipientInvestment(claimToken, _dto) {
    const gift = await prisma_client_1.prisma.gift.findUnique({ where: { claimToken } });
    if (!gift)
        throw new http_errors_1.NotFoundError('Regalo no encontrado.');
    if (gift.status === 'REDEEMED') {
        throw new http_errors_1.BadRequestError('Esta inversión ya fue vendida.');
    }
    if (gift.status !== 'INVESTED') {
        throw new http_errors_1.BadRequestError('Este regalo aún no está disponible para venta.');
    }
    // Obtener valor actual antes de vender
    const accountId = gift.alpacaAccountId || `mock-${gift.id}`;
    const snapshot = await alpaca_service_1.alpacaService.getPortfolio(accountId);
    const amountReturned = snapshot.totalValue;
    // Actualizar estado a REDEEMED
    await prisma_client_1.prisma.gift.update({
        where: { id: gift.id },
        data: { status: 'REDEEMED' },
    });
    return {
        success: true,
        amountReturned,
        message: 'Tu inversión ha sido vendida exitosamente. El monto será transferido en 1-3 días hábiles.',
    };
}
//# sourceMappingURL=recipient.service.js.map