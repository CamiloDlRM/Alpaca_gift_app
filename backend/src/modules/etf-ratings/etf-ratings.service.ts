import * as ratingsRepo from './etf-ratings.repository';
import { BadRequestError } from '../../shared/errors/http-errors';
import { getETFBySymbol } from '../etfs/etfs.service';
import type {
  CreateRatingDto,
  ETFRatingsAggregateResponse,
  RatingResponse,
  RatingRole,
} from './etf-ratings.types';

type RatingWithUser = {
  id: string;
  userId: string;
  etfSymbol: string;
  stars: number;
  role: string;
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
    role: rating.role as RatingRole,
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

function ensureValidRole(role: unknown): RatingRole {
  if (role !== 'SENDER' && role !== 'RECEIVER') {
    throw new BadRequestError('El rol debe ser "SENDER" o "RECEIVER".');
  }
  return role;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(2));
}

export async function upsertRating(
  userId: string,
  etfSymbol: string,
  dto: CreateRatingDto
): Promise<RatingResponse> {
  const symbol = ensureValidSymbol(etfSymbol);
  const role = ensureValidRole(dto.role);

  if (!Number.isInteger(dto.stars) || dto.stars < 1 || dto.stars > 5) {
    throw new BadRequestError('La calificación debe ser un número entero entre 1 y 5.');
  }

  const rating = await ratingsRepo.upsertRating(userId, symbol, dto.stars, role, dto.comment);
  return toRatingResponse(rating as RatingWithUser);
}

export async function getRatingsForETF(
  etfSymbol: string,
  userId?: string
): Promise<ETFRatingsAggregateResponse> {
  const symbol = ensureValidSymbol(etfSymbol);

  const ratings = (await ratingsRepo.findByETF(symbol)) as RatingWithUser[];
  const totalCount = ratings.length;
  const averageStars = average(ratings.map((r) => r.stars));

  const senderRatings = ratings.filter((r) => r.role === 'SENDER');
  const receiverRatings = ratings.filter((r) => r.role === 'RECEIVER');

  const mapped = ratings.map(toRatingResponse);

  let userSenderRating: RatingResponse | null = null;
  let userReceiverRating: RatingResponse | null = null;
  if (userId) {
    userSenderRating =
      mapped.find((r) => r.userId === userId && r.role === 'SENDER') ?? null;
    userReceiverRating =
      mapped.find((r) => r.userId === userId && r.role === 'RECEIVER') ?? null;
  }

  return {
    ratings: mapped,
    averageStars,
    totalCount,
    senderAverageStars: average(senderRatings.map((r) => r.stars)),
    senderCount: senderRatings.length,
    receiverAverageStars: average(receiverRatings.map((r) => r.stars)),
    receiverCount: receiverRatings.length,
    userSenderRating,
    userReceiverRating,
  };
}

export async function getUserRatingForETF(
  userId: string,
  etfSymbol: string,
  role: RatingRole
): Promise<RatingResponse | null> {
  const symbol = ensureValidSymbol(etfSymbol);
  const validRole = ensureValidRole(role);
  const rating = (await ratingsRepo.findByUserAndETF(
    userId,
    symbol,
    validRole
  )) as RatingWithUser | null;
  return rating ? toRatingResponse(rating) : null;
}
