import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

/**
 * Custom error interface with status code
 */
interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Error response structure
 */
interface ErrorResponse {
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string[];
}

/**
 * Centralized error handling middleware
 * Logs errors and sends appropriate HTTP responses
 * Handles both custom AppError and generic Error objects
 *
 * Error handling strategy:
 * 1. Log error with context (method, path, user info)
 * 2. Determine HTTP status code (from error or default 500)
 * 3. Send appropriate JSON response
 * 4. Include stack trace only in development
 */
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Log error with context
  const logContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    error: err.message,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Log at appropriate level
  if (statusCode >= 500) {
    logger.error('Server error:', logContext);
    if (err.stack) {
      logger.error('Stack trace:', err.stack);
    }
  } else if (statusCode >= 400) {
    logger.warn('Client error:', logContext);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack.split('\n');
  }

  // Include request ID if available (for tracing)
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}
