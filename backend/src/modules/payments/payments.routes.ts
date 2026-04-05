import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createPaymentIntentHandler, confirmGiftHandler, webhookHandler } from './payments.controller';

const router = Router();

// Webhook must use raw body - mounted separately in app.ts
router.post('/webhook', webhookHandler);
router.post('/create-intent', authMiddleware, createPaymentIntentHandler);
router.post('/confirm', authMiddleware, confirmGiftHandler);

export default router;
