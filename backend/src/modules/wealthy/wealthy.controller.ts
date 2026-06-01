import { Request, Response, NextFunction } from 'express';
import { chatWealthy } from './wealthy.service';
import { WealthyChatRequest } from './wealthy.types';

export async function wealthyChatHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mode, messages } = req.body as WealthyChatRequest;

    if (!mode || !messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing mode or messages' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const userEmail = req.user?.email;
    await chatWealthy(mode, messages, res, userEmail);
  } catch (err) {
    next(err);
  }
}
