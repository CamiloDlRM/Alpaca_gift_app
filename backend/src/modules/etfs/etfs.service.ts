import type { ETF } from './etfs.types';

export const ETF_CATALOG: ETF[] = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "Large Cap", description: "An exchange-traded fund that tracks the S&P 500" },
  { symbol: "VTI", name: "Vanguard Total Market ETF", category: "Large Cap", description: "Total US stock market exposure" },
  { symbol: "QQQ", name: "Invesco QQQ (Nasdaq 100)", category: "Technology", description: "Tracks the top 100 Nasdaq companies" },
  { symbol: "VGT", name: "Vanguard Information Technology ETF", category: "Technology", description: "US technology sector companies" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", category: "Small Cap", description: "Small-cap US stocks" },
  { symbol: "AGG", name: "iShares Core US Aggregate Bond ETF", category: "Bonds", description: "Broad US bond market exposure" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", category: "Bonds", description: "Investment-grade US bonds" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF", category: "International", description: "Developed international markets" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", category: "International", description: "Emerging market economies" },
];

// Seeded mock price changes
const mockChanges: Record<string, number> = {
  VOO: 1.23, VTI: 0.87, QQQ: 2.14, VGT: 1.95, IWM: -0.43,
  AGG: 0.12, BND: 0.08, VEA: 0.67, VWO: -0.31,
};

const mockPrices: Record<string, number> = {
  VOO: 445.23, VTI: 238.45, QQQ: 432.18, VGT: 487.65, IWM: 196.32,
  AGG: 97.54, BND: 73.21, VEA: 48.76, VWO: 41.23,
};

export function getAllETFs(): ETF[] {
  return ETF_CATALOG.map(etf => ({
    ...etf,
    changePercent: mockChanges[etf.symbol] ?? 0,
    price: mockPrices[etf.symbol] ?? 100,
  }));
}

export function getCategories(): string[] {
  return [...new Set(ETF_CATALOG.map(e => e.category))];
}

export function getETFBySymbol(symbol: string): ETF | undefined {
  const etf = ETF_CATALOG.find(e => e.symbol === symbol.toUpperCase());
  if (!etf) return undefined;
  return {
    ...etf,
    changePercent: mockChanges[etf.symbol] ?? 0,
    price: mockPrices[etf.symbol] ?? 100,
  };
}
