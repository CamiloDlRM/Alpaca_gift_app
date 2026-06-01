export type RatingRole = 'SENDER' | 'RECEIVER';

export interface CreateRatingDto {
  stars: number;
  role: RatingRole;
  comment?: string;
}

export interface RatingResponse {
  id: string;
  userId: string;
  userName: string;
  etfSymbol: string;
  stars: number;
  role: RatingRole;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ETFRatingsAggregateResponse {
  ratings: RatingResponse[];
  averageStars: number;
  totalCount: number;
  senderAverageStars: number;
  senderCount: number;
  receiverAverageStars: number;
  receiverCount: number;
  userSenderRating: RatingResponse | null;
  userReceiverRating: RatingResponse | null;
}
