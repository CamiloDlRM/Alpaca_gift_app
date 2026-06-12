import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { listHandler, createHandler, updateHandler, deleteHandler } from './favorites.controller';

const router = Router();

const scheduleSchema = z.object({
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  label: z.string().optional(),
});

const createSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
  etfSymbol: z.string().min(1),
  amount: z.number().positive(),
  schedules: z.array(scheduleSchema).default([]),
});

const updateSchema = z.object({
  recipientName: z.string().min(1).optional(),
  etfSymbol: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  schedules: z.array(scheduleSchema).optional(),
});

router.get('/', listHandler);
router.post('/', validate(createSchema), createHandler);
router.put('/:id', validate(updateSchema), updateHandler);
router.delete('/:id', deleteHandler);

export default router;
