export interface CreateRatingDto {
  stars: number;
  comment?: string;
}

export interface RatingResponse {
  id: string;
  userId: string;
  userName: string;
  etfSymbol: string;
  stars: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ETFRatingsAggregateResponse {
  ratings: RatingResponse[];
  averageStars: number;
  totalCount: number;
  userRating: RatingResponse | null;
}
