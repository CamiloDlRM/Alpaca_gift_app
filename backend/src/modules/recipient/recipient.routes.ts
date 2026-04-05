import { Router } from 'express';
import { getPortfolioHandler, getHistoryHandler, sellHandler } from './recipient.controller';

const router = Router();

router.get('/portfolio/:claimToken', getPortfolioHandler);
router.get('/portfolio/:claimToken/history', getHistoryHandler);
router.post('/portfolio/:claimToken/sell', sellHandler);

export default router;
