import { Request, Response, NextFunction } from 'express';
import * as rankingsService from './rankings.service';

export async function getFullRankingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await rankingsService.getFullRankings();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTopCategoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await rankingsService.getTopCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTopETFsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await rankingsService.getTopETFs();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryETFsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await rankingsService.getTopETFsByCategory(req.params.category);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
