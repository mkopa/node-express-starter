/**
 * Standard error response structure
 * Used by error handler middleware
 */
export interface ErrorResponse {
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string[];
}

/**
 * Validation error detail
 * Used when request validation fails
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Validation error response
 * Returned when AJV validation fails
 */
export interface ValidationErrorResponse {
  message: string;
  errors: ValidationErrorDetail[];
}

/**
 * Rate limit error response
 * Returned when rate limit is exceeded
 */
export interface RateLimitErrorResponse {
  error: string;
  message: string;
  retryAfter: number;
}
