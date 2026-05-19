import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { registerHandler, loginHandler, verifyEmailHandler, resendVerificationHandler, sendPasswordCodeHandler, confirmPasswordResetHandler } from './auth.controller';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const confirmPasswordSchema = z.object({
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.get('/verify-email', verifyEmailHandler);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerificationHandler);
router.post('/password-code/send', authMiddleware, sendPasswordCodeHandler);
router.post('/password-code/confirm', authMiddleware, validate(confirmPasswordSchema), confirmPasswordResetHandler);

export default router;
