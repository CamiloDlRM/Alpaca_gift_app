import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendPasswordCodeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.sendPasswordResetCode((req as any).user.id);
    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
}

export async function confirmPasswordResetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, newPassword } = req.body;
    await authService.confirmPasswordReset((req as any).user.id, code, newPassword);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
