import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/db/prisma.client';
import * as service from './gift-events.service';

export async function createHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await service.createEvent(req.user!.id, req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function listMineHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await service.listMyEvents(req.user!.id);
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function listInvitedHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    const events = await service.listInvitedEvents(user.email);
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function getByInviteTokenHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.getEventByInviteToken(req.params.inviteToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function acceptHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const participant = await service.acceptEventInvitation(req.params.inviteToken);
    res.json(participant);
  } catch (err) {
    next(err);
  }
}

export async function declineHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const participant = await service.declineEventInvitation(req.params.inviteToken);
    res.json(participant);
  } catch (err) {
    next(err);
  }
}

export async function linkGiftHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const participant = await service.linkGiftToEvent(req.params.inviteToken, req.body.giftId);
    res.json(participant);
  } catch (err) {
    next(err);
  }
}

export async function closeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await service.closeEvent(req.params.eventId, req.user!.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
}
