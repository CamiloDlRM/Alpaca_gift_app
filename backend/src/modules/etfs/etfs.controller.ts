import { Request, Response, NextFunction } from 'express';
import * as etfsService from './etfs.service';
import { NotFoundError } from '../../shared/errors/http-errors';
import { fetchPriceHistory } from '../market-data/market-data.service';

export function getAllETFsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(etfsService.getAllETFs());
  } catch (err) {
    next(err);
  }
}

export function getCategoriesHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(etfsService.getCategories());
  } catch (err) {
    next(err);
  }
}

export function getETFBySymbolHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const etf = etfsService.getETFBySymbol(req.params.symbol);
    if (!etf) throw new NotFoundError('ETF not found');
    res.json(etf);
  } catch (err) {
    next(err);
  }
}

export async function getETFHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const etf = etfsService.getETFBySymbol(symbol);
    if (!etf) throw new NotFoundError('ETF not found');
    const period = (req.query.period as string) || '1M';
    const valid = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';
    const data = await fetchPriceHistory(symbol, valid);
    res.json({ symbol, period: valid, data });
  } catch (err) {
    next(err);
  }
}
