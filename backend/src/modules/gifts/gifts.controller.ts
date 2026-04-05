import { Request, Response, NextFunction } from 'express';
import * as giftsService from './gifts.service';

export async function createGiftHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gift = await giftsService.createGift(req.user!.id, req.body);
    res.status(201).json(gift);
  } catch (err) {
    next(err);
  }
}

export async function listGiftsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gifts = await giftsService.listGifts(req.user!.id);
    res.json(gifts);
  } catch (err) {
    next(err);
  }
}

export async function getGiftHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gift = await giftsService.getGift(req.params.id, req.user!.id);
    res.json(gift);
  } catch (err) {
    next(err);
  }
}

export async function getGiftByClaimTokenHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gift = await giftsService.getGiftByClaimToken(req.params.claimToken);
    res.json(gift);
  } catch (err) {
    next(err);
  }
}

export async function startClaimingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gift = await giftsService.startClaiming(req.params.claimToken);
    res.json(gift);
  } catch (err) {
    next(err);
  }
}
