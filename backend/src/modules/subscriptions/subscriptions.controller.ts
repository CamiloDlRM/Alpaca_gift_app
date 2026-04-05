import { Request, Response, NextFunction } from 'express';
import {
  getSubscriptionStatus,
  createSubscription,
  cancelSubscription,
} from './subscriptions.service';
import { CreateSubscriptionDto } from './subscriptions.types';

export async function getStatusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getSubscriptionStatus(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createSubscriptionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await createSubscription(req.user!.id, req.body as CreateSubscriptionDto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscriptionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await cancelSubscription(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
