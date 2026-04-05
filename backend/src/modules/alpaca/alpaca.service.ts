import type { AlpacaService, KYCData, PortfolioSnapshot, ChartDataPoint } from './alpaca.types';
import { alpacaMock } from './alpaca.mock';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { getGiftByClaimToken as findGiftByClaimToken, transitionStatus } from '../gifts/gifts.service';
import { GiftStatus } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.client';

function createRealAlpacaService(): AlpacaService {
  const BASE_URL = process.env.ALPACA_BASE_URL || 'https://broker-api.sandbox.alpaca.markets';
  const KEY = process.env.ALPACA_BROKER_KEY!;
  const SECRET = process.env.ALPACA_BROKER_SECRET!;

  const headers = {
    'APCA-BROKER-API-KEY': KEY,
    'APCA-BROKER-SECRET-KEY': SECRET,
    'Content-Type': 'application/json',
  };

  return {
    async createAccount(kyc: KYCData) {
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
      const data = await response.json() as { id: string };
      return { accountId: data.id };
    },
    async fundAccount(accountId: string, amount: number) {
      await fetch(`${BASE_URL}/v1/accounts/${accountId}/ach_relationships`, { method: 'POST', headers, body: JSON.stringify({ bank_account_type: 'CHECKING', bank_routing_number: '121000358', bank_account_number: '32132231abc' }) });
    },
    async buyETF(accountId: string, symbol: string, amount: number) {
      const response = await fetch(`${BASE_URL}/v1/trading/accounts/${accountId}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ symbol, notional: amount.toString(), side: 'buy', type: 'market', time_in_force: 'day' }),
      });
      const data = await response.json() as { id: string };
      return { orderId: data.id };
    },
    async getPortfolio(accountId: string): Promise<PortfolioSnapshot> {
      return alpacaMock.getPortfolio(accountId);
    },
    async getPriceHistory(symbol: string, period: string): Promise<ChartDataPoint[]> {
      return alpacaMock.getPriceHistory(symbol, period);
    },
  };
}

const isMock = !process.env.ALPACA_BROKER_KEY || process.env.ALPACA_BROKER_KEY === 'mock';
export const alpacaService: AlpacaService = isMock ? alpacaMock : createRealAlpacaService();

// Wire EventBus listeners
eventBus.on<{ giftId: string }>(EVENTS.AGREEMENT_SIGNED, async ({ giftId }) => {
  try {
    const gift = await prisma.gift.findUnique({ where: { id: giftId }, include: { kyc: true } });
    if (!gift || !gift.kyc) return;

    await transitionStatus(giftId, GiftStatus.ACCOUNT_CREATING);

    const { accountId } = await alpacaService.createAccount({
      fullName: gift.kyc.fullName,
      dob: gift.kyc.dob,
      ssnLast4: gift.kyc.ssnLast4,
      address: gift.kyc.address,
      city: gift.kyc.city,
      state: gift.kyc.state,
      zip: gift.kyc.zip,
    });

    await alpacaService.fundAccount(accountId, gift.amount);
    const { orderId } = await alpacaService.buyETF(accountId, gift.etfSymbol, gift.amount);

    await transitionStatus(giftId, GiftStatus.INVESTED, { alpacaAccountId: accountId, alpacaOrderId: orderId });

    eventBus.emit(EVENTS.ACCOUNT_CREATED, { giftId, accountId });
    eventBus.emit(EVENTS.ETF_PURCHASED, { giftId, orderId });
  } catch (err) {
    console.error('Alpaca flow error:', err);
    await transitionStatus(giftId, GiftStatus.FAILED);
  }
});
