import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { BadRequestError } from '../../shared/errors/http-errors';

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

export async function verifyEmailHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) throw new BadRequestError('Invalid or expired verification token');
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resendVerificationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resendVerification(req.body.email);
    res.json({ message: 'If that email is registered and unverified, we sent a new verification link' });
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
