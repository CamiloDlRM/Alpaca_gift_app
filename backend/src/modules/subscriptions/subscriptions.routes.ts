import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  getStatusHandler,
  createSubscriptionHandler,
  cancelSubscriptionHandler,
} from './subscriptions.controller';

const router = Router();

router.get('/', authMiddleware, getStatusHandler);
router.post('/', authMiddleware, createSubscriptionHandler);
router.delete('/', authMiddleware, cancelSubscriptionHandler);

export default router;
