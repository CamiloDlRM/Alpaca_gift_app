import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/http-errors';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new BadRequestError(result.error.errors.map(e => e.message).join(', ')));
      return;
    }
    req.body = result.data;
    next();
  };
}
