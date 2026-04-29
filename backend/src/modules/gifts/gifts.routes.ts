import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  createGiftHandler, listGiftsHandler, getGiftHandler,
  getGiftByClaimTokenHandler, startClaimingHandler, listReceivedGiftsHandler,
} from './gifts.controller';

const router = Router();

const createGiftSchema = z.object({
  recipientName: z.string().min(1),
  occasion: z.string().min(1),
  etfSymbol: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
  deliveryDate: z.string(),
  recipientEmail: z.string().email().optional(),
});

router.post('/', authMiddleware, validate(createGiftSchema), createGiftHandler);
router.get('/', authMiddleware, listGiftsHandler);
router.get('/received', authMiddleware, listReceivedGiftsHandler);
router.get('/claim/:claimToken', getGiftByClaimTokenHandler);
router.patch('/claim/:claimToken/start', startClaimingHandler);
router.get('/:id', authMiddleware, getGiftHandler);

export default router;
