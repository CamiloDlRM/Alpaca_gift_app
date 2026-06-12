import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { listHandler, createHandler, deleteHandler } from './saved-recipients.controller';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

router.get('/', listHandler);
router.post('/', validate(createSchema), createHandler);
router.delete('/:id', deleteHandler);

export default router;
