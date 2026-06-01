import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { upsertRatingHandler, getRatingsHandler } from './etf-ratings.controller';

const router = Router();

const createRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  role: z.enum(['SENDER', 'RECEIVER']),
  comment: z.string().max(2000).optional(),
});

router.post('/:symbol', authMiddleware, validate(createRatingSchema), upsertRatingHandler);
router.get('/:symbol', getRatingsHandler);

export default router;
