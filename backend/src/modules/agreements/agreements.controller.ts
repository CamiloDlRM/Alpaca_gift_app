import { Request, Response, NextFunction } from 'express';
import * as agreementsService from './agreements.service';

export async function signAgreementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await agreementsService.signAgreement(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
