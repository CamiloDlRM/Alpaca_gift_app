import { Request, Response, NextFunction } from 'express';
import * as ratingsService from './etf-ratings.service';
import { verifyToken } from '../../shared/utils/jwt';
import type { CreateRatingDto } from './etf-ratings.types';

export async function upsertRatingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const symbol = req.params.symbol;
    const dto = req.body as CreateRatingDto;
    const result = await ratingsService.upsertRating(userId, symbol, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRatingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const symbol = req.params.symbol;

    // Optionally identify the calling user via Bearer token (route is public)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        userId = typeof payload.id === 'string' ? payload.id : undefined;
      } catch {
        userId = undefined;
      }
    }

    const result = await ratingsService.getRatingsForETF(symbol, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
