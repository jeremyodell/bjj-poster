# Skill: Lambda Handler Creation

Use this skill when creating new AWS Lambda handlers for the BJJ Poster App.

## When to Use

- Creating a new API endpoint
- Adding a new SQS consumer
- Creating EventBridge handlers

## Handler Template

```typescript
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { logger, AppError, ValidationError } from '@bjj-poster/core';

interface HandlerInput {
  // Define input shape
}

interface HandlerOutput {
  // Define output shape
}

const parseInput = (body: string | null): HandlerInput => {
  if (!body) {
    throw new ValidationError('Request body is required');
  }
  
  try {
    const parsed = JSON.parse(body);
    // Add validation logic here
    return parsed as HandlerInput;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
};

const createResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  
  logger.info('Handler invoked', {
    requestId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    // 1. Extract user context from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    // 2. Parse and validate input
    const input = parseInput(event.body);

    // 3. Execute business logic
    // const result = await businessLogicFunction(userId, input);

    // 4. Return success response
    return createResponse(200, { success: true });
    
  } catch (error) {
    logger.error('Handler failed', { requestId, error });

    if (error instanceof ValidationError) {
      return createResponse(400, { message: error.message });
    }

    if (error instanceof AppError) {
      return createResponse(error.statusCode, { message: error.message });
    }

    return createResponse(500, { message: 'Internal server error' });
  }
};
```

## File Location

Place handlers in: `apps/api/src/handlers/{domain}/{action}.ts`

Examples:
- `apps/api/src/handlers/user/get-profile.ts`
- `apps/api/src/handlers/poster/create-poster.ts`
- `apps/api/src/handlers/billing/stripe-webhook.ts`

## Testing Pattern

Create a test file alongside: `apps/api/src/handlers/{domain}/{action}.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './create-poster';
import { createMockEvent } from '../../test/helpers';

describe('createPoster handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const event = createMockEvent({
      body: JSON.stringify({ templateId: 'tmpl_001' }),
      authorizer: null,
    });

    const result = await handler(event, {} as any, () => {});
    
    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when body is missing', async () => {
    const event = createMockEvent({
      body: null,
      authorizer: { claims: { sub: 'user-123' } },
    });

    const result = await handler(event, {} as any, () => {});
    
    expect(result.statusCode).toBe(400);
  });

  it('creates poster successfully', async () => {
    const event = createMockEvent({
      body: JSON.stringify({ templateId: 'tmpl_001' }),
      authorizer: { claims: { sub: 'user-123' } },
    });

    const result = await handler(event, {} as any, () => {});
    
    expect(result.statusCode).toBe(200);
  });
});
```

## Checklist

- [ ] Input validation with clear error messages
- [ ] Proper error handling with AppError classes
- [ ] Structured logging with requestId
- [ ] TypeScript types for input/output
- [ ] Unit tests covering success and error cases
- [ ] CORS headers included in response
