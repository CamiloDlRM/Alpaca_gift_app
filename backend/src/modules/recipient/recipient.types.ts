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

export interface SellRequestDto {
  shares?: number;
}

export interface SellResponse {
  success: boolean;
  amountReturned: number;
  message: string;
}
