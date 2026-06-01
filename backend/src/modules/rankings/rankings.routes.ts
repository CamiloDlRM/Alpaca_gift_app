import { Router } from 'express';
import {
  getFullRankingsHandler,
  getTopCategoriesHandler,
  getTopETFsHandler,
  getCategoryETFsHandler,
} from './rankings.controller';

const router = Router();

// All rankings routes are public (no auth required).
router.get('/', getFullRankingsHandler);
router.get('/categories', getTopCategoriesHandler);
router.get('/etfs', getTopETFsHandler);
router.get('/etfs/:category', getCategoryETFsHandler);

export default router;
