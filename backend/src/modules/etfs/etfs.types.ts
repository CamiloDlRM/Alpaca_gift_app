export interface ETF {
  symbol: string;
  name: string;
  category: string;
  description: string;
  changePercent?: number;
  price?: number;
}
