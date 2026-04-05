import { Request, Response, NextFunction } from 'express';
import * as portfolioService from './portfolio.service';

export async function getPortfolioHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await portfolioService.getPortfolio(req.params.giftId, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPriceHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = (req.query.period as string) || '1M';
    const result = await portfolioService.getPriceHistory(req.params.giftId, period);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
