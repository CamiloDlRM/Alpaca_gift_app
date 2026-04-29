import * as ratingsRepo from './etf-ratings.repository';
import { BadRequestError } from '../../shared/errors/http-errors';
import { getETFBySymbol } from '../etfs/etfs.service';
import type {
  CreateRatingDto,
  ETFRatingsAggregateResponse,
  RatingResponse,
} from './etf-ratings.types';

type RatingWithUser = {
  id: string;
  userId: string;
  etfSymbol: string;
  stars: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
};

function toRatingResponse(rating: RatingWithUser): RatingResponse {
  return {
    id: rating.id,
    userId: rating.userId,
    userName: rating.user.name,
    etfSymbol: rating.etfSymbol,
    stars: rating.stars,
    comment: rating.comment,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
  };
}

function ensureValidSymbol(etfSymbol: string): string {
  const symbol = etfSymbol.toUpperCase();
  const etf = getETFBySymbol(symbol);
  if (!etf) {
    throw new BadRequestError(`El ETF "${symbol}" no existe en el catálogo.`);
  }
  return symbol;
}

export async function upsertRating(
  userId: string,
  etfSymbol: string,
  dto: CreateRatingDto
): Promise<RatingResponse> {
  const symbol = ensureValidSymbol(etfSymbol);

  if (!Number.isInteger(dto.stars) || dto.stars < 1 || dto.stars > 5) {
    throw new BadRequestError('La calificación debe ser un número entero entre 1 y 5.');
  }

  const rating = await ratingsRepo.upsertRating(userId, symbol, dto.stars, dto.comment);
  return toRatingResponse(rating as RatingWithUser);
}

export async function getRatingsForETF(
  etfSymbol: string,
  userId?: string
): Promise<ETFRatingsAggregateResponse> {
  const symbol = ensureValidSymbol(etfSymbol);

  const ratings = (await ratingsRepo.findByETF(symbol)) as RatingWithUser[];
  const totalCount = ratings.length;
  const averageStars = totalCount === 0
    ? 0
    : ratings.reduce((acc, r) => acc + r.stars, 0) / totalCount;

  const mapped = ratings.map(toRatingResponse);

  let userRating: RatingResponse | null = null;
  if (userId) {
    const own = mapped.find((r) => r.userId === userId);
    userRating = own ?? null;
  }

  return {
    ratings: mapped,
    averageStars: Number(averageStars.toFixed(2)),
    totalCount,
    userRating,
  };
}

export async function getUserRatingForETF(
  userId: string,
  etfSymbol: string
): Promise<RatingResponse | null> {
  const symbol = ensureValidSymbol(etfSymbol);
  const rating = (await ratingsRepo.findByUserAndETF(userId, symbol)) as RatingWithUser | null;
  return rating ? toRatingResponse(rating) : null;
}
