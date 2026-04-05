import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import { submitKYCHandler, confirmSSNHandler, getQuestionsHandler, verifyAnswersHandler } from './kyc.controller';

const router = Router();

const submitKYCSchema = z.object({
  claimToken: z.string(),
  fullName: z.string().min(1),
  dob: z.string(),
  ssn: z.string().optional(),
  ssnLast4: z.string().length(4),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
});

router.post('/submit', validate(submitKYCSchema), submitKYCHandler);
router.post('/confirm-ssn', confirmSSNHandler);
router.get('/questions/:claimToken', getQuestionsHandler);
router.post('/verify-answers', verifyAnswersHandler);

export default router;
