import type { AlpacaService, KYCData, PortfolioSnapshot, ChartDataPoint } from './alpaca.types';
import { alpacaMock } from './alpaca.mock';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { getGiftByClaimToken as findGiftByClaimToken, transitionStatus } from '../gifts/gifts.service';
import { GiftStatus } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.client';
import { fetchCurrentPrice } from '../market-data/market-data.service';

function createRealAlpacaService(): AlpacaService {
  const BASE_URL = process.env.ALPACA_BASE_URL || 'https://broker-api.sandbox.alpaca.markets';
  const KEY = process.env.ALPACA_BROKER_KEY!;
  const SECRET = process.env.ALPACA_BROKER_SECRET!;
  // Firm/omnibus account ID used to journal funds to client accounts.
  // Set ALPACA_FIRM_ACCOUNT_ID in your env once you have a funded firm account.
  const FIRM_ACCOUNT_ID = process.env.ALPACA_FIRM_ACCOUNT_ID;

  const headers = {
    'APCA-BROKER-API-KEY': KEY,
    'APCA-BROKER-SECRET-KEY': SECRET,
    'Content-Type': 'application/json',
  };

  return {
    async createAccount(kyc: KYCData) {
      const [firstName, ...lastParts] = kyc.fullName.split(' ');
      const lastName = lastParts.join(' ') || 'Unknown';
      const ip = kyc.ipAddress || '0.0.0.0';

      const response = await fetch(`${BASE_URL}/v1/accounts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact: {
            email_address: kyc.email,
            street_address: [kyc.address],
            city: kyc.city,
            state: kyc.state,
            postal_code: kyc.zip,
          },
          identity: {
            given_name: firstName,
            family_name: lastName,
            date_of_birth: kyc.dob,
            // Full SSN required for production. If only last-4 is stored, Alpaca will
            // reject the account in production — see SSN_NOTE in alpaca.service.ts.
            tax_id: kyc.ssnLast4.length === 9 ? kyc.ssnLast4 : `000-00-${kyc.ssnLast4}`,
            tax_id_type: 'USA_SSN',
            country_of_citizenship: 'USA',
            country_of_birth: 'USA',
            country_of_tax_residence: 'USA',
            funding_source: ['employment_income'],
          },
          agreements: [
            { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: ip },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Alpaca createAccount failed (${response.status}): ${err}`);
      }
      const data = await response.json() as { id: string };
      return { accountId: data.id };
    },

    async fundAccount(accountId: string, amount: number) {
      if (!FIRM_ACCOUNT_ID) {
        // Sandbox fallback: fake ACH (only works in sandbox environment)
        console.warn('[Alpaca] ALPACA_FIRM_ACCOUNT_ID not set — using sandbox ACH fallback');
        await fetch(`${BASE_URL}/v1/accounts/${accountId}/ach_relationships`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ bank_account_type: 'CHECKING', bank_routing_number: '121000358', bank_account_number: '32132231abc' }),
        });
        return;
      }

      // Production: journal from WealthGift firm account to the client account
      const response = await fetch(`${BASE_URL}/v1/journals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from_account: FIRM_ACCOUNT_ID,
          to_account: accountId,
          entry_type: 'JNLC',        // cash journal
          amount: amount.toFixed(2),
          description: 'WealthGift investment funding',
        }),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Alpaca fundAccount journal failed (${response.status}): ${err}`);
      }
    },

    async buyETF(accountId: string, symbol: string, amount: number) {
      const response = await fetch(`${BASE_URL}/v1/trading/accounts/${accountId}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol,
          notional: amount.toFixed(2),
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
        }),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Alpaca buyETF failed (${response.status}): ${err}`);
      }
      const data = await response.json() as { id: string };
      return { orderId: data.id };
    },

    async getPortfolio(accountId: string): Promise<PortfolioSnapshot> {
      // Real portfolio from Alpaca positions
      try {
        const res = await fetch(`${BASE_URL}/v1/trading/accounts/${accountId}/positions`, { headers });
        if (!res.ok) return alpacaMock.getPortfolio(accountId);
        const positions = await res.json() as Array<{ symbol: string; qty: string; market_value: string; cost_basis: string }>;
        const totalValue   = positions.reduce((s, p) => s + parseFloat(p.market_value), 0);
        const totalCost    = positions.reduce((s, p) => s + parseFloat(p.cost_basis), 0);
        const gainLoss     = totalValue - totalCost;
        const gainLossPct  = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
        const first        = positions[0];
        return {
          accountId,
          totalValue,
          gainLoss,
          gainLossPercent: gainLossPct,
          shares: first ? parseFloat(first.qty) : 0,
          symbol: first?.symbol ?? '',
        };
      } catch {
        return alpacaMock.getPortfolio(accountId);
      }
    },

    async getPriceHistory(symbol: string, period: string): Promise<ChartDataPoint[]> {
      return alpacaMock.getPriceHistory(symbol, period);
    },
  };
}

const isMock = !process.env.ALPACA_BROKER_KEY || process.env.ALPACA_BROKER_KEY === 'mock';
export const alpacaService: AlpacaService = isMock ? alpacaMock : createRealAlpacaService();

// On startup: recover gifts that got stuck due to a server crash mid-flow.
// Both AGREEMENT_SIGNED and ACCOUNT_CREATING are safe to re-emit in mock mode.
// In production (real Alpaca), ACCOUNT_CREATING state is unknown — mark as FAILED.
export async function recoverStuckGifts(): Promise<void> {
  try {
    const stuck = await prisma.gift.findMany({
      where: { status: { in: ['AGREEMENT_SIGNED', 'ACCOUNT_CREATING'] } },
    });

    for (const gift of stuck) {
      if (gift.status === 'AGREEMENT_SIGNED') {
        console.warn(`[Recovery] Re-triggering Alpaca flow for gift ${gift.id} (stuck at AGREEMENT_SIGNED)`);
        // Reset to AGREEMENT_SIGNED so the event handler can transition to ACCOUNT_CREATING
        eventBus.emit(EVENTS.AGREEMENT_SIGNED, { giftId: gift.id });
      } else if (gift.status === 'ACCOUNT_CREATING') {
        if (isMock) {
          // Mock mode: Alpaca state is deterministic — safe to roll back and retry
          console.warn(`[Recovery] Mock mode: rolling back gift ${gift.id} to AGREEMENT_SIGNED for retry`);
          await prisma.gift.update({ where: { id: gift.id }, data: { status: 'AGREEMENT_SIGNED' } });
          eventBus.emit(EVENTS.AGREEMENT_SIGNED, { giftId: gift.id });
        } else {
          // Real Alpaca: state is unknown — human review needed
          console.warn(`[Recovery] Real Alpaca: marking gift ${gift.id} as FAILED (stuck at ACCOUNT_CREATING)`);
          await prisma.gift.update({ where: { id: gift.id }, data: { status: 'FAILED' } });
        }
      }
    }
  } catch (err) {
    console.error('[Recovery] Failed to recover stuck gifts:', err);
  }
}

// Wire EventBus listeners
eventBus.on<{ giftId: string }>(EVENTS.AGREEMENT_SIGNED, async ({ giftId }) => {
  try {
    const gift = await prisma.gift.findUnique({ where: { id: giftId }, include: { kyc: true } });
    if (!gift) return;

    // If this gift has no KYC (returning-user PIN flow sometimes skips creation),
    // fall back to the most recent verified KYC for this recipient email.
    let kyc = gift.kyc;
    if (!kyc && gift.recipientEmail) {
      const fallback = await prisma.gift.findFirst({
        where: {
          recipientEmail: gift.recipientEmail,
          id: { not: gift.id },
          kyc: { verified: true },
        },
        include: { kyc: true },
        orderBy: { createdAt: 'desc' },
      });
      kyc = fallback?.kyc ?? null;
    }

    if (!kyc) {
      console.error(`[Alpaca] Gift ${giftId} has no KYC record — cannot invest.`);
      await prisma.gift.update({ where: { id: giftId }, data: { status: GiftStatus.FAILED } })
        .catch(e => console.error('[Alpaca] Could not mark gift as FAILED:', e));
      return;
    }

    await transitionStatus(giftId, GiftStatus.ACCOUNT_CREATING);

    const { accountId } = await alpacaService.createAccount({
      fullName: kyc.fullName,
      dob: kyc.dob,
      ssnLast4: kyc.ssnLast4,
      address: kyc.address,
      city: kyc.city,
      state: kyc.state,
      zip: kyc.zip,
      email: gift.recipientEmail ?? `${kyc.ssnLast4}@wealthgift.io`,
      ipAddress: (kyc as any).ipAddress ?? undefined,
    });

    await alpacaService.fundAccount(accountId, gift.amount);
    const { orderId } = await alpacaService.buyETF(accountId, gift.etfSymbol, gift.amount);

    // Capture the ETF price at the time of purchase so we can compute accurate
    // gain/loss later without relying on daily changePercent or history approximations.
    let purchasePricePerShare: number | undefined;
    try {
      purchasePricePerShare = await fetchCurrentPrice(gift.etfSymbol);
    } catch {
      // Non-fatal: gain/loss will fall back to approximation for this gift.
    }

    await transitionStatus(giftId, GiftStatus.INVESTED, {
      alpacaAccountId: accountId,
      alpacaOrderId: orderId,
      ...(purchasePricePerShare != null ? { purchasePricePerShare } : {}),
    });

    eventBus.emit(EVENTS.ACCOUNT_CREATED, { giftId, accountId });
    eventBus.emit(EVENTS.ETF_PURCHASED, { giftId, orderId });
  } catch (err) {
    console.error('Alpaca flow error:', err);
    // Use a direct update instead of transitionStatus — the gift may be in
    // AGREEMENT_SIGNED (if account creation failed before the first status
    // transition), which is not in ACCOUNT_CREATING's valid predecessors for FAILED.
    await prisma.gift.update({
      where: { id: giftId },
      data: { status: GiftStatus.FAILED },
    }).catch(e => console.error('[Recovery] Could not mark gift as FAILED:', e));
  }
});
