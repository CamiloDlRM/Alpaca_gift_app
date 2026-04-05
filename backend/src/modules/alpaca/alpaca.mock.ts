import type { AlpacaService, KYCData, PortfolioSnapshot, ChartDataPoint } from './alpaca.types';
import { v4 as uuidv4 } from 'uuid';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateChartData(symbol: string, period: string): ChartDataPoint[] {
  const seedMap: Record<string, number> = {
    VOO: 42, VTI: 17, QQQ: 99, VGT: 55, IWM: 23,
    AGG: 8, BND: 31, VEA: 64, VWO: 77,
  };
  const seed = seedMap[symbol] ?? 50;
  const rand = seededRandom(seed);

  const periodPoints: Record<string, number> = {
    '1D': 24, '1W': 7, '1M': 30, '1Y': 52, 'ALL': 120,
  };
  const points = periodPoints[period] ?? 30;

  const startPrice = 100;
  const data: ChartDataPoint[] = [];
  let price = startPrice;

  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    if (period === '1D') date.setHours(date.getHours() - i);
    else if (period === '1W') date.setDate(date.getDate() - i);
    else if (period === '1M') date.setDate(date.getDate() - i);
    else if (period === '1Y') date.setDate(date.getDate() - i * 7);
    else date.setDate(date.getDate() - i * 3);

    price = price * (1 + (rand() - 0.47) * 0.02);
    data.push({ date: date.toISOString(), value: Math.round(price * 100) / 100 });
  }
  return data;
}

export const alpacaMock: AlpacaService = {
  async createAccount(_kyc: KYCData) {
    return { accountId: `mock-${uuidv4()}` };
  },
  async fundAccount(_accountId: string, _amount: number) {
    return;
  },
  async buyETF(_accountId: string, _symbol: string, _amount: number) {
    return { orderId: `order-${uuidv4()}` };
  },
  async getPortfolio(accountId: string): Promise<PortfolioSnapshot> {
    return {
      accountId,
      totalValue: 523.45,
      gainLoss: 23.45,
      gainLossPercent: 4.69,
      shares: 1.17,
      symbol: 'VOO',
    };
  },
  async getPriceHistory(symbol: string, period: string): Promise<ChartDataPoint[]> {
    return generateChartData(symbol, period);
  },
};
