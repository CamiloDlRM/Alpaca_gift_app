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

export interface PortfolioInvestmentItem {
  giftId: string;
  recipientName: string;
  etfSymbol: string;
  etfName: string;
  amount: number;
  currentValue: number;
  changePercent: number;
  changeAmount: number;
  status: string;
}

export interface PortfolioOverviewResponse {
  totalBalance: number;
  totalGifted: number;
  investments: PortfolioInvestmentItem[];
  overallChangePercent: number;
}
