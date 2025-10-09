import { Request, Response, NextFunction } from 'express';
import { DomainError, isDomainError } from '../../types/errors/DomainErrors';
import { ErrorResponse } from '../../types/responses/error.response';
import logger from '../../utils/logger';

/**
 * Centralized error handling middleware
 * Handles both domain errors and generic errors
 * Logs errors with context and sends appropriate HTTP responses
 *
 * Error handling strategy:
 * 1. Check if error is a domain error (custom errors with statusCode)
 * 2. Log error with context (method, path, user info)
 * 3. Determine HTTP status code
 * 4. Send appropriate JSON response
 * 5. Include stack trace only in development
 */
export function errorHandler(
  err: Error | DomainError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determine status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Handle domain errors (custom errors with statusCode)
  if (isDomainError(err)) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
  }

  // Log error with context
  const logContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    error: err.message,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Log at appropriate level based on status code
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
