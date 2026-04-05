import { Router } from 'express';
import { getAllETFsHandler, getCategoriesHandler, getETFBySymbolHandler } from './etfs.controller';

const router = Router();

router.get('/', getAllETFsHandler);
router.get('/categories', getCategoriesHandler);
router.get('/:symbol', getETFBySymbolHandler);

export default router;
