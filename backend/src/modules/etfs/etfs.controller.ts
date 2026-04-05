import { Request, Response, NextFunction } from 'express';
import * as etfsService from './etfs.service';
import { NotFoundError } from '../../shared/errors/http-errors';

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
