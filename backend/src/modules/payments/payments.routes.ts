import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createPaymentIntentHandler, webhookHandler } from './payments.controller';

const router = Router();

// Webhook must use raw body - mounted separately in app.ts
router.post('/webhook', webhookHandler);
router.post('/create-intent', authMiddleware, createPaymentIntentHandler);

export default router;
