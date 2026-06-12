import { Request, Response, NextFunction } from 'express';
import * as service from './important-dates.service';

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await service.listImportantDates(req.user!.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await service.createImportantDate(req.user!.id, req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteImportantDate(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
