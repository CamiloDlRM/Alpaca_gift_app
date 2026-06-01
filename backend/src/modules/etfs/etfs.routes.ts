import { Router } from 'express';
import { getAllETFsHandler, getCategoriesHandler, getETFBySymbolHandler, getETFHistoryHandler } from './etfs.controller';

const router = Router();

router.get('/', getAllETFsHandler);
router.get('/categories', getCategoriesHandler);
router.get('/:symbol/history', getETFHistoryHandler);
router.get('/:symbol', getETFBySymbolHandler);

export default router;
