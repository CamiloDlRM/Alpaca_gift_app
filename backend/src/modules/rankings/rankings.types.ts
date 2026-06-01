export interface CategoryRanking {
  category: string;
  rank: number;
  giftCount: number;
  recentGiftCount: number; // last 30 days
  averageRating: number;
  senderAverageRating: number;
  receiverAverageRating: number;
  totalRatings: number;
  rankScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ETFRanking {
  symbol: string;
  name: string;
  category: string;
  description: string;
  rank: number;
  giftCount: number;
  recentGiftCount: number; // last 30 days
  averageRating: number;
  senderAverageRating: number;
  receiverAverageRating: number;
  totalRatings: number;
  rankScore: number;
  trend: 'up' | 'down' | 'stable';
  price?: number;
  changePercent?: number;
}

export interface RankingsResponse {
  topCategories: CategoryRanking[];
  topETFs: ETFRanking[];
  updatedAt: Date;
}

export interface CategoryETFsResponse {
  category: string;
  topETFs: ETFRanking[];
}
