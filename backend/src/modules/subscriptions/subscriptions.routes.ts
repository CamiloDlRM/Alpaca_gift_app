import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  getStatusHandler,
  createSubscriptionHandler,
  cancelSubscriptionHandler,
} from './subscriptions.controller';

const router = Router();

const createSubscriptionSchema = z.object({
  paymentMethodId: z.string().min(1),
  plan: z.enum(['PRO', 'PRO_PLUS']).optional(),
});

router.get('/', authMiddleware, getStatusHandler);
router.post('/', authMiddleware, validate(createSubscriptionSchema), createSubscriptionHandler);
router.delete('/', authMiddleware, cancelSubscriptionHandler);

export default router;
