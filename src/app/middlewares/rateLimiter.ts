import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * In production, use Redis-based solution (e.g., express-rate-limit with Redis store)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Rate limiting middleware to prevent abuse
 * Limits requests per IP address
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Clean up expired entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });

  // Initialize or get current record
  if (!store[ip] || store[ip].resetTime < now) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return next();
  }

  // Increment count
  store[ip].count++;

  // Check if limit exceeded
  if (store[ip].count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((store[ip].resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', store[ip].resetTime.toString());
    res.setHeader('Retry-After', retryAfter.toString());

    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - store[ip].count).toString());
  res.setHeader('X-RateLimit-Reset', store[ip].resetTime.toString());

  next();
}
