/**
 * DriveWealth broker adapter (SCAFFOLDING — not wired in yet).
 *
 * This implements the SAME interface as the current Alpaca adapter
 * (`AlpacaService` in ../alpaca/alpaca.types), so the rest of the app can swap
 * brokers without any other change. Nothing here runs until you activate it
 * (see "HOW TO ACTIVATE" at the bottom) — the existing Alpaca flow keeps working.
 *
 * Everything DriveWealth-specific (endpoints, payload shapes, field names) is
 * marked with `TODO(dw)` because it must be verified against YOUR DriveHub
 * sandbox docs — DriveWealth's exact routes differ per white-label setup.
 *
 * Docs: https://developer.drivewealth.com/
 *
 * ---------------------------------------------------------------------------
 * WHAT I NEED YOU TO GET FROM DRIVEWEALTH (DriveHub) — fill these env vars:
 *   DRIVEWEALTH_BASE_URL        UAT/sandbox hostname (e.g. https://bo-api.sandbox.drivewealth.com)
 *   DRIVEWEALTH_APP_KEY         Client app key (sent as the `dw-client-app-key` header)
 *   DRIVEWEALTH_USERNAME        Operator/API user for session auth
 *   DRIVEWEALTH_PASSWORD        Operator/API password for session auth
 *   DRIVEWEALTH_PARENT_IB_ID    Your parent IB / WLP id used when opening accounts
 *   DRIVEWEALTH_ACCOUNT_TYPE    Account type id to open (e.g. the "LIVE"/cash account type)
 * (All are placeholders until DriveWealth provisions your sandbox — see notes.)
 * ---------------------------------------------------------------------------
 */

import type {
  AlpacaService as BrokerService,
  KYCData,
  PortfolioSnapshot,
  ChartDataPoint,
} from '../alpaca/alpaca.types';
import { fetchPriceHistory } from '../market-data/market-data.service';

// --- Config (read lazily inside the factory, mirroring the Alpaca adapter) ---
const BASE_URL = process.env.DRIVEWEALTH_BASE_URL || 'https://bo-api.sandbox.drivewealth.com';
const APP_KEY = process.env.DRIVEWEALTH_APP_KEY || '';
const USERNAME = process.env.DRIVEWEALTH_USERNAME || '';
const PASSWORD = process.env.DRIVEWEALTH_PASSWORD || '';
const PARENT_IB_ID = process.env.DRIVEWEALTH_PARENT_IB_ID || '';
const ACCOUNT_TYPE = process.env.DRIVEWEALTH_ACCOUNT_TYPE || '';

/**
 * DriveWealth uses session auth: authenticate once to get a short-lived
 * `DW-AUTH-TOKEN`, then send it on every request. We cache it until it nears
 * expiry and re-authenticate transparently.
 */
class DriveWealthAuth {
  private token: string | null = null;
  private expiresAt = 0;

  async getToken(): Promise<string> {
    // Re-use the cached token until ~1 min before it expires.
    if (this.token && Date.now() < this.expiresAt - 60_000) return this.token;

    // TODO(dw): confirm the auth route + payload for your setup.
    // Common BaaS shape: POST /back-office/auth  { username, password }
    //   headers: { 'dw-client-app-key': APP_KEY }
    //   response: { authToken, ... }  (token also returned as `DW-AUTH-TOKEN`)
    const res = await fetch(`${BASE_URL}/back-office/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dw-client-app-key': APP_KEY,
      },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`DriveWealth auth failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as { authToken?: string; sessionKey?: string; expiresIn?: number };
    const token = data.authToken ?? data.sessionKey;
    if (!token) throw new Error('DriveWealth auth: no token in response');

    this.token = token;
    // TODO(dw): use the real TTL from the response if provided. Default 30 min.
    this.expiresAt = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 30 * 60_000);
    return token;
  }

  /** Force re-auth on the next call (e.g. after a 401). */
  invalidate() {
    this.token = null;
    this.expiresAt = 0;
  }
}

export function createDriveWealthService(): BrokerService {
  const auth = new DriveWealthAuth();

  /** Authenticated JSON request helper with one automatic re-auth on 401. */
  // Derive the init type from the global fetch signature so we don't depend on
  // the DOM lib being present (backend tsconfig only includes ES2020).
  async function dwFetch<T>(
    path: string,
    init: NonNullable<Parameters<typeof fetch>[1]> = {},
    retry = true,
  ): Promise<T> {
    const token = await auth.getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'dw-client-app-key': APP_KEY,
        'dw-auth-token': token,
        ...(init.headers || {}),
      },
    });

    if (res.status === 401 && retry) {
      auth.invalidate();
      return dwFetch<T>(path, init, false);
    }
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`DriveWealth ${init.method || 'GET'} ${path} failed (${res.status}): ${err}`);
    }
    // Some DW endpoints return empty bodies (204) — guard the JSON parse.
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    /**
     * Open a brokerage account for the recipient.
     * DriveWealth is a two-step flow: create a USER (with KYC identity), then
     * create an ACCOUNT for that user. Returns the account id we persist on the gift.
     */
    async createAccount(kyc: KYCData): Promise<{ accountId: string }> {
      const [firstName, ...lastParts] = kyc.fullName.split(' ');
      const lastName = lastParts.join(' ') || 'Unknown';

      // TODO(dw): confirm the /users payload. DriveWealth needs a fuller identity
      // than we currently capture — notably PHONE and (for US accounts) the FULL
      // SSN as taxID. We only store ssnLast4 today (same limitation as Alpaca).
      // You'll likely need to extend the KYC capture before production.
      const userBody = {
        userType: 'INDIVIDUAL_TRADER',
        parentIB: { id: PARENT_IB_ID },
        emailAddress1: kyc.email,
        firstName,
        lastName,
        // TODO(dw): phone is required by DriveWealth — add it to KYCData/capture.
        // phone: kyc.phone,
        countryID: 'USA',
        userDetails: {
          taxIDType: 'SSN',
          taxID: kyc.ssnLast4, // TODO(dw): must be the FULL 9-digit SSN in production.
          dob: kyc.dob,
          citizenship: 'USA',
        },
        address: {
          street1: kyc.address,
          city: kyc.city,
          province: kyc.state,
          postalCode: kyc.zip,
          country: 'USA',
        },
        disclosures: {
          // TODO(dw): DriveWealth requires signed disclosures/agreements. We already
          // capture a signed customer agreement — map the timestamp/ip here.
          termsOfUse: true,
          customerAgreement: true,
          marketDataAgreement: true,
          rule14b: true,
          findersFee: false,
          privacyPolicy: true,
          dataSharing: true,
          signedBy: kyc.fullName,
        },
        ipAddress: kyc.ipAddress || '0.0.0.0',
      };

      const user = await dwFetch<{ id: string }>('/users', {
        method: 'POST',
        body: JSON.stringify(userBody),
      });

      // TODO(dw): confirm the /accounts payload + the accountType id from DriveHub.
      const account = await dwFetch<{ id: string; accountNo?: string }>('/accounts', {
        method: 'POST',
        body: JSON.stringify({
          userID: user.id,
          accountType: ACCOUNT_TYPE,
          accountManagementType: 'SELF',
          tradingType: 'CASH',
          ignoreMarketHoursForTest: true, // TODO(dw): sandbox convenience flag; verify name.
        }),
      });

      return { accountId: account.id };
    },

    /**
     * Fund the account. In BaaS you typically create a deposit against the
     * account; DriveWealth's sandbox lets you simulate/auto-approve deposits so
     * you can immediately place a trade.
     */
    async fundAccount(accountId: string, amount: number): Promise<void> {
      // TODO(dw): confirm funding route. Options seen in DriveWealth:
      //   POST /funding/deposits   { accountID, amount, currency, type }
      // In sandbox there's usually a way to auto-approve so the cash lands instantly.
      await dwFetch('/funding/deposits', {
        method: 'POST',
        body: JSON.stringify({
          accountID: accountId,
          amount: Number(amount.toFixed(2)),
          currency: 'USD',
          type: 'SANDBOX_INSTANT', // TODO(dw): replace with the real sandbox deposit type.
        }),
      });
    },

    /**
     * Place a fractional (notional / cash-based) market buy for `amount` USD.
     * Returns the DriveWealth order id; the caller separately records the
     * purchase price for gain/loss (see alpaca.service event handler).
     */
    async buyETF(accountId: string, symbol: string, amount: number): Promise<{ orderId: string }> {
      // TODO(dw): confirm /orders payload. DriveWealth notional buy shape:
      //   { accountID, symbol, side: 'BUY', orderType: 'MARKET', amountCash }
      const order = await dwFetch<{ id: string; orderStatus?: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          accountID: accountId,
          symbol,
          side: 'BUY',
          orderType: 'MARKET',
          amountCash: Number(amount.toFixed(2)),
        }),
      });
      return { orderId: order.id };
    },

    /**
     * Current portfolio snapshot for one account. DriveWealth returns positions
     * with market value and cost basis; we aggregate them into the same shape
     * the app already expects (mirrors the Alpaca adapter).
     */
    async getPortfolio(accountId: string): Promise<PortfolioSnapshot> {
      // TODO(dw): confirm the summary route/shape. Common: GET /accounts/{id}/summary
      // returning { equity: { equityValue }, ... } and an `orders`/`positions` array.
      type DWPosition = { symbol: string; openQty: number; marketValue: number; costBasis: number };
      type DWSummary = { equity?: { equityValue?: number }; positions?: DWPosition[] };

      const summary = await dwFetch<DWSummary>(`/accounts/${accountId}/summary`);
      const positions = summary.positions ?? [];

      const totalValue = positions.reduce((s, p) => s + (p.marketValue || 0), 0);
      const totalCost = positions.reduce((s, p) => s + (p.costBasis || 0), 0);
      const gainLoss = totalValue - totalCost;
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
      const first = positions[0];

      return {
        accountId,
        totalValue,
        gainLoss,
        gainLossPercent,
        shares: first ? first.openQty : 0,
        symbol: first?.symbol ?? '',
      };
    },

    /**
     * Price history for charts. DriveWealth market data is a separate product;
     * to avoid coupling we reuse the existing market-data service (Yahoo), which
     * is already what the recipient/portfolio charts use elsewhere.
     */
    async getPriceHistory(symbol: string, period: string): Promise<ChartDataPoint[]> {
      return fetchPriceHistory(symbol, period);
    },
  };
}

/**
 * HOW TO ACTIVATE (later — do NOT do this until the sandbox works end-to-end):
 *
 * 1. Fill the DRIVEWEALTH_* env vars (see top) with your DriveHub sandbox values.
 * 2. In `src/modules/alpaca/alpaca.service.ts`, replace the single export line:
 *
 *      // const isMock = !process.env.ALPACA_BROKER_KEY || process.env.ALPACA_BROKER_KEY === 'mock';
 *      // export const alpacaService: AlpacaService = isMock ? alpacaMock : createRealAlpacaService();
 *
 *    with a broker selector, e.g.:
 *
 *      import { createDriveWealthService } from '../drivewealth/drivewealth.service';
 *      const broker = process.env.BROKER || 'mock'; // 'mock' | 'alpaca' | 'drivewealth'
 *      export const alpacaService: AlpacaService =
 *        broker === 'drivewealth' ? createDriveWealthService() :
 *        broker === 'alpaca'      ? createRealAlpacaService() :
 *                                   alpacaMock;
 *
 *    Because this adapter implements the same interface, the event wiring at the
 *    bottom of alpaca.service.ts (createAccount → fundAccount → buyETF →
 *    purchasePricePerShare) keeps working unchanged.
 *
 * 3. Test the flow in sandbox: claim a gift → KYC → agreement → account opens →
 *    funds → fractional buy → portfolio shows value.
 */
