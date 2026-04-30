export interface RecipientTransaction {
  date: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  shares: number;
  pricePerShare: number;
  total: number;
}

export interface RecipientPortfolioResponse {
  giftId: string;
  recipientName: string;
  etfSymbol: string;
  occasion: string;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  shares: number;
  investedAt: string;
  isRedeemed: boolean;
  redeemedAmount?: number;
  transactions: RecipientTransaction[];
}

export interface ConsolidatedGiftItem {
  giftId: string;
  claimToken: string;
  occasion: string;
  amountInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  investedAt: string;
  isRedeemed: boolean;
  redeemedAmount?: number;
}

export interface ConsolidatedPositionItem {
  etfSymbol: string;
  etfName: string;
  totalInvested: number;
  totalCurrentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  changePercent: number;
  gifts: ConsolidatedGiftItem[];
}

export interface ConsolidatedPortfolioResponse {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  positions: ConsolidatedPositionItem[];
}

export interface SellRequestDto {
  shares?: number;
}

export interface SellResponse {
  success: boolean;
  amountReturned: number;
  message: string;
}
