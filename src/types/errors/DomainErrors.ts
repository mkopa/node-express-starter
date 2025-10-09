/**
 * Base class for all domain errors
 * Extends Error with HTTP status code
 */
export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * User-related errors
 */
export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409;
  readonly errorCode = 'USER_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly errorCode = 'USER_NOT_FOUND';

  constructor(userId?: number) {
    super(userId ? `User with id ${userId} not found` : 'User not found');
  }
}

/**
 * Company-related errors
 */
export class CompanyNotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly errorCode = 'COMPANY_NOT_FOUND';

  constructor(companyId: number) {
    super(`Company with id ${companyId} does not exist`);
  }
}

/**
 * Token-related errors
 */
export class InvalidTokenError extends DomainError {
  readonly statusCode = 404;
  readonly errorCode = 'INVALID_TOKEN';

  constructor(message: string = 'Invalid or expired token') {
    super(message);
  }
}

export class TokenExpiredError extends DomainError {
  readonly statusCode = 410;
  readonly errorCode = 'TOKEN_EXPIRED';

  constructor() {
    super('Password reset token has expired');
  }
}

export class TokenAlreadyUsedError extends DomainError {
  readonly statusCode = 410;
  readonly errorCode = 'TOKEN_ALREADY_USED';

  constructor() {
    super('This password reset token has already been used');
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DomainError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

// WeakPasswordError extends DomainError directly instead of ValidationError
// This fixes the errorCode conflict
export class WeakPasswordError extends DomainError {
  readonly statusCode = 400;
  readonly errorCode = 'WEAK_PASSWORD';

  constructor(message: string = 'Password does not meet security requirements') {
    super(message);
  }
}

/**
 * Business logic errors
 */
export class BusinessRuleViolationError extends DomainError {
  readonly statusCode = 422;
  readonly errorCode = 'BUSINESS_RULE_VIOLATION';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends DomainError {
  readonly statusCode = 500;
  readonly errorCode = 'DATABASE_ERROR';

  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

/**
 * Transaction errors
 */
export class TransactionError extends DomainError {
  readonly statusCode = 500;
  readonly errorCode = 'TRANSACTION_ERROR';

  constructor(message: string = 'Transaction failed') {
    super(message);
  }
}

/**
 * Type guard to check if error is a domain error
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
