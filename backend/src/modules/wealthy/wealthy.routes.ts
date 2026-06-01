import { Router } from 'express';
import { wealthyChatHandler } from './wealthy.controller';
import { optionalAuthMiddleware } from '../../shared/middleware/auth.middleware';

const router = Router();

// Mode 1 (regulations) and Mode 2 (investments) work unauthenticated.
// Mode 3 (portfolio) requires a valid token so req.user.email is populated.
router.post('/chat', optionalAuthMiddleware, wealthyChatHandler);

export default router;
