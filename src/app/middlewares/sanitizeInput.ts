import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

function sanitizeObject(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = validator.escape(value);
    } else if (typeof value === 'object') {
      // Recursive call for nested objects or arrays
      sanitizeObject(value);
    }
  }
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize all string inputs in body and query
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
}
