/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error - 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error - 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * External service error - 502 Bad Gateway
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }
  
  return new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
}
