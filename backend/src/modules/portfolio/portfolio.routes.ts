import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  getPortfolioHandler,
  getPriceHistoryHandler,
  getOverviewHandler,
} from './portfolio.controller';

const router = Router();

// Aggregate overview across all of the calling user's gifts (must come before /:giftId).
router.get('/overview', authMiddleware, getOverviewHandler);

router.get('/:giftId', authMiddleware, getPortfolioHandler);
router.get('/:giftId/history', authMiddleware, getPriceHistoryHandler);

export default router;
