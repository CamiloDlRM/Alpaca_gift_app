import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getPortfolioHandler, getHistoryHandler, sellHandler, getConsolidatedPortfolioHandler } from './recipient.controller';

const router = Router();

// Consolidated portfolio for a logged-in recipient — must come before /:claimToken routes
router.get('/portfolio/consolidated', authMiddleware, getConsolidatedPortfolioHandler);

router.get('/portfolio/:claimToken', getPortfolioHandler);
router.get('/portfolio/:claimToken/history', getHistoryHandler);
router.post('/portfolio/:claimToken/sell', sellHandler);

export default router;
