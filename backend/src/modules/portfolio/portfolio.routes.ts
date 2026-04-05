import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getPortfolioHandler, getPriceHistoryHandler } from './portfolio.controller';

const router = Router();

router.get('/:giftId', authMiddleware, getPortfolioHandler);
router.get('/:giftId/history', authMiddleware, getPriceHistoryHandler);

export default router;
