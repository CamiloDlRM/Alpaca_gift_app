"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alpacaService = void 0;
const alpaca_mock_1 = require("./alpaca.mock");
const event_bus_1 = require("../../shared/events/event-bus");
const gifts_service_1 = require("../gifts/gifts.service");
const client_1 = require("@prisma/client");
const prisma_client_1 = require("../../shared/db/prisma.client");
function createRealAlpacaService() {
    const BASE_URL = process.env.ALPACA_BASE_URL || 'https://broker-api.sandbox.alpaca.markets';
    const KEY = process.env.ALPACA_BROKER_KEY;
    const SECRET = process.env.ALPACA_BROKER_SECRET;
    const headers = {
        'APCA-BROKER-API-KEY': KEY,
        'APCA-BROKER-SECRET-KEY': SECRET,
        'Content-Type': 'application/json',
    };
    return {
        async createAccount(kyc) {
            const [firstName, ...lastParts] = kyc.fullName.split(' ');
            const lastName = lastParts.join(' ') || 'Unknown';
            const response = await fetch(`${BASE_URL}/v1/accounts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    contact: { email_address: `${kyc.ssnLast4}@wealthgift.io`, street_address: [kyc.address], city: kyc.city, state: kyc.state, postal_code: kyc.zip },
                    identity: { given_name: firstName, family_name: lastName, date_of_birth: kyc.dob, tax_id: `XXX-XX-${kyc.ssnLast4}`, tax_id_type: 'USA_SSN', country_of_citizenship: 'USA', country_of_birth: 'USA', country_of_tax_residence: 'USA', funding_source: ['employment_income'] },
                    agreements: [{ agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: '0.0.0.0' }],
                }),
            });
            const data = await response.json();
            return { accountId: data.id };
        },
        async fundAccount(accountId, amount) {
            await fetch(`${BASE_URL}/v1/accounts/${accountId}/ach_relationships`, { method: 'POST', headers, body: JSON.stringify({ bank_account_type: 'CHECKING', bank_routing_number: '121000358', bank_account_number: '32132231abc' }) });
        },
        async buyETF(accountId, symbol, amount) {
            const response = await fetch(`${BASE_URL}/v1/trading/accounts/${accountId}/orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ symbol, notional: amount.toString(), side: 'buy', type: 'market', time_in_force: 'day' }),
            });
            const data = await response.json();
            return { orderId: data.id };
        },
        async getPortfolio(accountId) {
            return alpaca_mock_1.alpacaMock.getPortfolio(accountId);
        },
        async getPriceHistory(symbol, period) {
            return alpaca_mock_1.alpacaMock.getPriceHistory(symbol, period);
        },
    };
}
const isMock = !process.env.ALPACA_BROKER_KEY || process.env.ALPACA_BROKER_KEY === 'mock';
exports.alpacaService = isMock ? alpaca_mock_1.alpacaMock : createRealAlpacaService();
// Wire EventBus listeners
event_bus_1.eventBus.on(event_bus_1.EVENTS.AGREEMENT_SIGNED, async ({ giftId }) => {
    try {
        const gift = await prisma_client_1.prisma.gift.findUnique({ where: { id: giftId }, include: { kyc: true } });
        if (!gift || !gift.kyc)
            return;
        await (0, gifts_service_1.transitionStatus)(giftId, client_1.GiftStatus.ACCOUNT_CREATING);
        const { accountId } = await exports.alpacaService.createAccount({
            fullName: gift.kyc.fullName,
            dob: gift.kyc.dob,
            ssnLast4: gift.kyc.ssnLast4,
            address: gift.kyc.address,
            city: gift.kyc.city,
            state: gift.kyc.state,
            zip: gift.kyc.zip,
        });
        await exports.alpacaService.fundAccount(accountId, gift.amount);
        const { orderId } = await exports.alpacaService.buyETF(accountId, gift.etfSymbol, gift.amount);
        await (0, gifts_service_1.transitionStatus)(giftId, client_1.GiftStatus.INVESTED, { alpacaAccountId: accountId, alpacaOrderId: orderId });
        event_bus_1.eventBus.emit(event_bus_1.EVENTS.ACCOUNT_CREATED, { giftId, accountId });
        event_bus_1.eventBus.emit(event_bus_1.EVENTS.ETF_PURCHASED, { giftId, orderId });
    }
    catch (err) {
        console.error('Alpaca flow error:', err);
        await (0, gifts_service_1.transitionStatus)(giftId, client_1.GiftStatus.FAILED);
    }
});
//# sourceMappingURL=alpaca.service.js.map