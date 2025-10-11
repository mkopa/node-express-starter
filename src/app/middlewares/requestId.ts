import { v7 as uuidv7 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = (req.headers['x-request-id'] as string) || uuidv7();
  res.setHeader('X-Request-Id', req.id);
  next();
}
