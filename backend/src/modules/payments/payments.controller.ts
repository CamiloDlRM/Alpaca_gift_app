import { Request, Response, NextFunction } from 'express';
import { createPaymentIntent, confirmGift, handleWebhook } from './payments.service';
import { CreatePaymentIntentDto } from './payments.types';

export async function createPaymentIntentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreatePaymentIntentDto;
    const result = await createPaymentIntent(userId, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function confirmGiftHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { paymentIntentId } = req.body as { paymentIntentId: string };
    const result = await confirmGift(userId, paymentIntentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
