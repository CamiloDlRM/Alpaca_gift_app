import { Request, Response, NextFunction } from 'express';
import {
  getRecipientPortfolio,
  getRecipientHistory,
  sellRecipientInvestment,
} from './recipient.service';
import { SellRequestDto } from './recipient.types';

export async function getPortfolioHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getRecipientPortfolio(req.params.claimToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = (req.query.period as string) || '1M';
    const result = await getRecipientHistory(req.params.claimToken, period);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function sellHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as SellRequestDto;
    const result = await sellRecipientInvestment(req.params.claimToken, dto);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
