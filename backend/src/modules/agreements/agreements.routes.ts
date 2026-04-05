import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { signAgreementHandler } from './agreements.controller';

const router = Router();

const signSchema = z.object({
  claimToken: z.string(),
  signatureBase64: z.string().min(1),
  agreed: z.boolean(),
});

router.post('/sign', validate(signSchema), signAgreementHandler);

export default router;
