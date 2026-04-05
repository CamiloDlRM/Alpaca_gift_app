export interface PortfolioResponse {
  giftId: string;
  symbol: string;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  shares: number;
}

export interface HistoryResponse {
  period: string;
  data: { date: string; value: number }[];
}
