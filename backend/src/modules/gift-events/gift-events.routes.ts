import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  createHandler, listMineHandler, listInvitedHandler, getByInviteTokenHandler,
  acceptHandler, declineHandler, linkGiftHandler, closeHandler,
} from './gift-events.controller';

const router = Router();

const participantSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const etfOptionSchema = z.object({
  etfSymbol: z.string().min(1),
  targetAmount: z.number().positive(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  etfOptions: z.array(etfOptionSchema).min(1),
  participants: z.array(participantSchema).min(1),
});

const linkGiftSchema = z.object({
  giftId: z.string().min(1),
});

router.post('/', validate(createSchema), createHandler);
router.get('/', listMineHandler);
router.get('/invited', listInvitedHandler);
router.get('/invite/:inviteToken', getByInviteTokenHandler);
router.patch('/invite/:inviteToken/accept', acceptHandler);
router.patch('/invite/:inviteToken/decline', declineHandler);
router.patch('/invite/:inviteToken/link-gift', validate(linkGiftSchema), linkGiftHandler);
router.patch('/:eventId/close', closeHandler);

export default router;
