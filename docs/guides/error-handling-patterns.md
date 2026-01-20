# Error Handling Patterns

**Version:** 1.0
**Last Updated:** 2025-01-05

---

## Overview

This guide defines standard error handling patterns for the BJJ Poster Builder application. Consistent error handling ensures:

- **Debuggability** - Errors contain enough context to diagnose issues
- **User Experience** - Users receive helpful, actionable error messages
- **Observability** - Errors are logged with structured data for monitoring
- **Type Safety** - TypeScript catches error handling mistakes at compile time

---

## Error Class Hierarchy

We use custom error classes that extend the base `Error` class. This enables:
- Type-safe error handling with `instanceof` checks
- Automatic HTTP status code mapping
- Structured error responses

### Error Class Diagram

```
Error (built-in)
  └─► AppError (base class for all app errors)
       ├─► ValidationError (400 Bad Request)
       ├─► AuthenticationError (401 Unauthorized)
       ├─► AuthorizationError (403 Forbidden)
       ├─► NotFoundError (404 Not Found)
       ├─► ConflictError (409 Conflict)
       ├─► QuotaExceededError (429 Too Many Requests)
       └─► ExternalServiceError (502 Bad Gateway)
```

---

## Implementation

### Base Error Class

```typescript
// packages/core/src/errors/app-error.ts

/**
 * Base class for all application errors.
 * Provides structured error information for logging and API responses.
 */
export abstract class AppError extends Error {
  /**
   * HTTP status code for this error type
   */
  abstract readonly statusCode: number;

  /**
   * Machine-readable error code for client handling
   */
  abstract readonly errorCode: string;

  /**
   * Whether this error should be reported to error tracking (Sentry, etc.)
   */
  readonly isOperational: boolean;

  /**
   * Additional context for debugging
   */
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = true;
    this.context = context;

    // Maintains proper stack trace in V8 (Node.js)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON for API response
   */
  toJSON() {
    return {
      error: this.errorCode,
      message: this.message,
      ...(this.context && { details: this.context }),
    };
  }

  /**
   * Converts error to structured log format
   */
  toLogFormat() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      context: this.context,
      stack: this.stack,
    };
  }
}
```

### Concrete Error Classes

```typescript
// packages/core/src/errors/validation-error.ts

/**
 * Thrown when request data fails validation.
 * Maps to HTTP 400 Bad Request.
 *
 * @example
 * throw new ValidationError('Email is required', {
 *   field: 'email',
 *   value: undefined,
 * });
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'validation_error';
}

// packages/core/src/errors/authentication-error.ts

/**
 * Thrown when user is not authenticated.
 * Maps to HTTP 401 Unauthorized.
 *
 * @example
 * throw new AuthenticationError('Invalid or expired token');
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'authentication_error';
}

// packages/core/src/errors/authorization-error.ts

/**
 * Thrown when user lacks permission for an action.
 * Maps to HTTP 403 Forbidden.
 *
 * @example
 * throw new AuthorizationError('Premium subscription required', {
 *   requiredTier: 'premium',
 *   currentTier: 'free',
 * });
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'authorization_error';
}

// packages/core/src/errors/not-found-error.ts

/**
 * Thrown when a requested resource doesn't exist.
 * Maps to HTTP 404 Not Found.
 *
 * @example
 * throw new NotFoundError('Poster not found', {
 *   posterId: 'post_123',
 *   userId: 'user_456',
 * });
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'not_found';
}

// packages/core/src/errors/conflict-error.ts

/**
 * Thrown when request conflicts with current state.
 * Maps to HTTP 409 Conflict.
 *
 * @example
 * throw new ConflictError('Email already registered', {
 *   email: 'user@example.com',
 * });
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'conflict';
}

// packages/core/src/errors/quota-exceeded-error.ts

/**
 * Thrown when user exceeds subscription quota.
 * Maps to HTTP 429 Too Many Requests.
 *
 * @example
 * throw new QuotaExceededError('Monthly poster limit reached', {
 *   limit: 2,
 *   used: 2,
 *   tier: 'free',
 * });
 */
export class QuotaExceededError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'quota_exceeded';
}

// packages/core/src/errors/external-service-error.ts

/**
 * Thrown when an external service (AWS, Stripe) fails.
 * Maps to HTTP 502 Bad Gateway.
 *
 * @example
 * throw new ExternalServiceError('Bedrock image generation failed', {
 *   service: 'bedrock',
 *   model: 'amazon.titan-image-generator-v1',
 *   statusCode: 500,
 * });
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly errorCode = 'external_service_error';
}
```

### Barrel Export

```typescript
// packages/core/src/errors/index.ts

export { AppError } from './app-error';
export { ValidationError } from './validation-error';
export { AuthenticationError } from './authentication-error';
export { AuthorizationError } from './authorization-error';
export { NotFoundError } from './not-found-error';
export { ConflictError } from './conflict-error';
export { QuotaExceededError } from './quota-exceeded-error';
export { ExternalServiceError } from './external-service-error';
```

---

## Lambda Handler Pattern

### Standard Handler Template

```typescript
// apps/api/src/handlers/poster/get-poster.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPosterById } from '@bjj-poster/db';
import { NotFoundError, AuthorizationError } from '@bjj-poster/core';
import { logger } from '@bjj-poster/core';
import { handleError } from '../../lib/error-handler';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const requestId = context.requestId;

  try {
    // 1. Extract and validate inputs
    const posterId = event.pathParameters?.id;
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!posterId) {
      throw new ValidationError('Poster ID is required', {
        parameter: 'id',
        path: event.path,
      });
    }

    // 2. Log request
    logger.info('Fetching poster', {
      requestId,
      userId,
      posterId,
    });

    // 3. Execute business logic
    const poster = await getPosterById(userId, posterId);

    if (!poster) {
      throw new NotFoundError('Poster not found', {
        posterId,
        userId,
      });
    }

    // 4. Authorization check
    if (poster.userId !== userId) {
      throw new AuthorizationError('You do not have access to this poster', {
        requestedBy: userId,
        ownedBy: poster.userId,
      });
    }

    // 5. Return success response
    logger.info('Poster fetched successfully', {
      requestId,
      posterId,
      status: poster.status,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(poster),
    };

  } catch (error) {
    // 6. Centralized error handling
    return handleError(error, requestId);
  }
};
```

### Error Handler Utility

```typescript
// apps/api/src/lib/error-handler.ts
import { APIGatewayProxyResult } from 'aws-lambda';
import { AppError } from '@bjj-poster/core';
import { logger } from '@bjj-poster/core';

/**
 * Centralized error handler for Lambda functions.
 * Converts errors to appropriate HTTP responses.
 */
export function handleError(
  error: unknown,
  requestId: string
): APIGatewayProxyResult {
  // Handle our custom AppError instances
  if (error instanceof AppError) {
    logger.error('Application error', {
      requestId,
      ...error.toLogFormat(),
    });

    return {
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error.toJSON()),
    };
  }

  // Handle AWS SDK errors
  if (isAwsError(error)) {
    logger.error('AWS SDK error', {
      requestId,
      name: error.name,
      message: error.message,
      code: error.$metadata?.httpStatusCode,
    });

    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'external_service_error',
        message: 'AWS service error',
      }),
    };
  }

  // Handle unknown errors (potential bugs)
  logger.error('Unexpected error', {
    requestId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
  });

  // Never expose internal error details to users
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'internal_server_error',
      message: 'An unexpected error occurred',
    }),
  };
}

/**
 * Type guard for AWS SDK errors
 */
function isAwsError(error: unknown): error is { name: string; message: string; $metadata?: { httpStatusCode?: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    '$metadata' in error
  );
}
```

---

## Validation Patterns

### Input Validation with Zod

```typescript
// apps/api/src/handlers/poster/create-poster.ts
import { z } from 'zod';
import { ValidationError } from '@bjj-poster/core';

// Define schema
const createPosterSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  athleteName: z.string().min(1, 'Athlete name is required').max(100),
  belt: z.enum(['white', 'blue', 'purple', 'brown', 'black']),
  team: z.string().min(1).max(200),
  tournament: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  athletePhotoUrl: z.string().url('Invalid photo URL'),
});

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate input
    const result = createPosterSchema.safeParse(body);

    if (!result.success) {
      // Convert Zod errors to ValidationError
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new ValidationError('Invalid request data', { errors });
    }

    const data = result.data;

    // Proceed with business logic...
    // ...

  } catch (error) {
    return handleError(error, context.requestId);
  }
};
```

### Manual Validation Pattern

```typescript
// When Zod isn't needed for simple checks
export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const posterId = event.pathParameters?.id;

    // Manual validation
    if (!posterId) {
      throw new ValidationError('Poster ID is required', {
        parameter: 'id',
      });
    }

    if (!posterId.startsWith('post_')) {
      throw new ValidationError('Invalid poster ID format', {
        posterId,
        expectedFormat: 'post_*',
      });
    }

    // Business logic...

  } catch (error) {
    return handleError(error, context.requestId);
  }
};
```

---

## Async Error Handling

### With Try-Catch

```typescript
export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Multiple async operations
    const [user, template, poster] = await Promise.all([
      getUserById(userId),
      getTemplateById(templateId),
      getPosterById(userId, posterId),
    ]);

    // Handle null results
    if (!user) {
      throw new NotFoundError('User not found', { userId });
    }

    if (!template) {
      throw new NotFoundError('Template not found', { templateId });
    }

    // Business logic...

  } catch (error) {
    return handleError(error, context.requestId);
  }
};
```

### Wrapping External Services

```typescript
// packages/core/src/services/bedrock-service.ts
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ExternalServiceError } from '../errors';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

export async function generateImage(prompt: string): Promise<Buffer> {
  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-image-generator-v1',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: { text: prompt },
        imageGenerationConfig: {
          numberOfImages: 1,
          width: 1024,
          height: 1024,
        },
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return Buffer.from(responseBody.images[0], 'base64');

  } catch (error) {
    // Wrap AWS errors in our error type
    throw new ExternalServiceError('Bedrock image generation failed', {
      service: 'bedrock',
      prompt: prompt.slice(0, 100), // Truncate for logging
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}
```

---

## Repository Layer Pattern

```typescript
// packages/db/src/repositories/poster-repository.ts
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '../client';
import { NotFoundError, ConflictError } from '@bjj-poster/core';

export async function getPosterById(
  userId: string,
  posterId: string
): Promise<Poster | null> {
  try {
    const result = await dynamoClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `USER#${userId}`,
        SK: `POSTER#${posterId}`,
      },
    }));

    return result.Item as Poster | null;

  } catch (error) {
    // Don't throw NotFoundError here - let handler decide
    // Repository layer should return null for missing items
    throw new ExternalServiceError('DynamoDB query failed', {
      operation: 'GetItem',
      userId,
      posterId,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createPoster(poster: Poster): Promise<void> {
  try {
    await dynamoClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME!,
      Item: {
        PK: `USER#${poster.userId}`,
        SK: `POSTER#${poster.id}`,
        ...poster,
      },
      ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwrites
    }));

  } catch (error) {
    // Check if it's a conditional check failure
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('Poster already exists', {
        posterId: poster.id,
      });
    }

    throw new ExternalServiceError('DynamoDB write failed', {
      operation: 'PutItem',
      posterId: poster.id,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}
```

---

## Logging Standard

```typescript
// packages/core/src/utils/logger.ts
import { Context } from 'aws-lambda';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata,
    };

    // CloudWatch will parse JSON automatically
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, metadata?: LogMetadata) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: LogMetadata) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    this.log('error', message, metadata);
  }
}

export const logger = new Logger();
```

### Logging Best Practices

```typescript
// ✅ GOOD: Structured logging with context
logger.info('Creating poster', {
  requestId: context.requestId,
  userId: user.id,
  templateId: data.templateId,
});

// ❌ BAD: String concatenation, no structure
console.log(`User ${user.id} creating poster with template ${data.templateId}`);

// ✅ GOOD: Log errors with full context
logger.error('Poster generation failed', {
  requestId: context.requestId,
  posterId: poster.id,
  error: error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : String(error),
});

// ❌ BAD: Log only error message
console.error('Failed:', error.message);
```

---

## Testing Error Handling

```typescript
// apps/api/src/handlers/poster/__tests__/get-poster.test.ts
import { handler } from '../get-poster';
import { getPosterById } from '@bjj-poster/db';
import { NotFoundError } from '@bjj-poster/core';

jest.mock('@bjj-poster/db');

describe('GET /api/posters/:id', () => {
  it('returns 404 when poster not found', async () => {
    // Mock repository to return null
    (getPosterById as jest.Mock).mockResolvedValue(null);

    const event = {
      pathParameters: { id: 'post_123' },
      requestContext: {
        authorizer: { claims: { sub: 'user_456' } },
      },
    } as any;

    const result = await handler(event, {} as any, () => {});

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'not_found',
      message: 'Poster not found',
      details: {
        posterId: 'post_123',
        userId: 'user_456',
      },
    });
  });

  it('returns 400 when poster ID missing', async () => {
    const event = {
      pathParameters: {}, // No id
      requestContext: {
        authorizer: { claims: { sub: 'user_456' } },
      },
    } as any;

    const result = await handler(event, {} as any, () => {});

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'validation_error',
      message: 'Poster ID is required',
      details: {
        parameter: 'id',
        path: undefined,
      },
    });
  });
});
```

---

## Quick Reference

### Error Class Selection Matrix

| Situation | Error Class | Status Code |
|-----------|-------------|-------------|
| Missing required field | `ValidationError` | 400 |
| Invalid format (email, date) | `ValidationError` | 400 |
| No auth token provided | `AuthenticationError` | 401 |
| Token expired/invalid | `AuthenticationError` | 401 |
| Insufficient permissions | `AuthorizationError` | 403 |
| Subscription tier too low | `AuthorizationError` | 403 |
| Resource doesn't exist | `NotFoundError` | 404 |
| User not found by ID | `NotFoundError` | 404 |
| Duplicate email/username | `ConflictError` | 409 |
| Poster already exists | `ConflictError` | 409 |
| Monthly quota exceeded | `QuotaExceededError` | 429 |
| AWS service failure | `ExternalServiceError` | 502 |
| Bedrock timeout | `ExternalServiceError` | 502 |
| Stripe API error | `ExternalServiceError` | 502 |

### Handler Checklist

Every Lambda handler should:
- [ ] Wrap main logic in try-catch
- [ ] Extract `requestId` from context
- [ ] Validate inputs early
- [ ] Log request start with context
- [ ] Use typed error classes
- [ ] Call `handleError()` in catch block
- [ ] Log success with context
- [ ] Return proper HTTP status codes

---

## Common Mistakes to Avoid

### ❌ Swallowing Errors

```typescript
// BAD: Silent failure
try {
  await updatePoster(id, data);
} catch (error) {
  console.log('Update failed'); // Error hidden!
}

// GOOD: Propagate or handle explicitly
try {
  await updatePoster(id, data);
} catch (error) {
  logger.error('Poster update failed', { error, posterId: id });
  throw new ExternalServiceError('Failed to update poster');
}
```

### ❌ Generic Error Messages

```typescript
// BAD: Unhelpful to users
throw new Error('Invalid');

// GOOD: Specific and actionable
throw new ValidationError('Tournament date must be in YYYY-MM-DD format', {
  field: 'date',
  value: invalidDate,
  example: '2025-12-31',
});
```

### ❌ Exposing Internal Details

```typescript
// BAD: Leaks implementation details
return {
  statusCode: 500,
  body: JSON.stringify({
    error: error.stack, // Never expose stack traces!
  }),
};

// GOOD: Generic message for unexpected errors
return handleError(error, requestId); // Returns safe message
```

---

## Additional Resources

- [AWS Lambda Error Handling Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-exceptions.html)
- [TypeScript Error Handling Guide](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Zod Validation Library](https://zod.dev/)

---

**Questions?** Refer to example handlers in `apps/api/src/handlers/` or ask in team chat.
