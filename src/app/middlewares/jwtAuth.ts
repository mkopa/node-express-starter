// src/middlewares/jwtAuth.ts - Add JWT support
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../repositories/UserRepository';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'change-me-in-production';
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user to request
    req.user = decoded as any;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Generate JWT token
export function generateJWT(user: User): string {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: 'user', // Add roles
    },
    secret,
    { expiresIn: '24h' }
  );
}
