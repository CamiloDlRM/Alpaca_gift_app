import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { listHandler, createHandler, deleteHandler } from './important-dates.controller';

const router = Router();

const createSchema = z.object({
  personName: z.string().min(1),
  personEmail: z.string().email().optional(),
  label: z.string().min(1),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  remindDaysBefore: z.number().int().min(0).max(60).optional(),
});

router.get('/', listHandler);
router.post('/', validate(createSchema), createHandler);
router.delete('/:id', deleteHandler);

export default router;
