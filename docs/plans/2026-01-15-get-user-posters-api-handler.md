# Get User Posters API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Lambda handler for fetching a user's poster history with pagination and filtering

**Architecture:** Lambda function queries DynamoDB using partition key with sort key prefix, supports cursor-based pagination and optional belt rank filtering

**Tech Stack:** AWS Lambda, TypeScript, DynamoDB, Vitest

---

## Task 1: Extend Poster Repository with getUserPosters

### Step 1: Write failing test for pagination

**File:** `packages/db/src/repositories/__tests__/poster-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PosterRepository } from '../poster-repository';

describe('PosterRepository.getUserPosters', () => {
  let repository: PosterRepository;

  beforeEach(() => {
    repository = new PosterRepository();
  });

  it('returns user posters with pagination', async () => {
    const result = await repository.getUserPosters({
      userId: 'user123',
      limit: 10
    });

    expect(result.posters).toBeDefined();
    expect(Array.isArray(result.posters)).toBe(true);
    expect(result.nextCursor).toBeDefined();
    expect(result.hasMore).toBe(false);
  });

  it('filters posters by belt rank', async () => {
    const result = await repository.getUserPosters({
      userId: 'user123',
      limit: 10,
      beltRank: 'Black'
    });

    result.posters.forEach(poster => {
      expect(poster.beltRank).toBe('Black');
    });
  });

  it('supports cursor pagination', async () => {
    const result = await repository.getUserPosters({
      userId: 'user123',
      limit: 5,
      cursor: 'eyJQSyI6IlVTRVIjdXNlcjEyMyIsIlNLIjoiUE9TVEVSIzE3MDUzMjAwMDAifQ=='
    });

    expect(result.posters).toBeDefined();
  });
});
```

### Step 2: Run test (expect FAIL)

```bash
cd packages/db
pnpm test src/repositories/__tests__/poster-repository.test.ts
```

**Expected output:** FAIL - `getUserPosters` method not defined

### Step 3: Implement getUserPosters method

**File:** `packages/db/src/repositories/poster-repository.ts`

Add types and method:

```typescript
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';

export interface GetUserPostersOptions {
  userId: string;
  limit: number;
  cursor?: string;
  beltRank?: string;
}

export interface GetUserPostersResult {
  posters: Poster[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Add to PosterRepository class:
async getUserPosters(options: GetUserPostersOptions): Promise<GetUserPostersResult> {
  const { userId, limit, cursor, beltRank } = options;

  const queryParams: QueryCommandInput = {
    TableName: this.tableName,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'POSTER#'
    },
    Limit: limit,
    ScanIndexForward: false // Newest first
  };

  // Add belt rank filter if provided
  if (beltRank) {
    queryParams.FilterExpression = 'beltRank = :beltRank';
    queryParams.ExpressionAttributeValues![':beltRank'] = beltRank;
  }

  // Add pagination cursor if provided
  if (cursor) {
    queryParams.ExclusiveStartKey = JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf-8')
    );
  }

  const result = await this.client.send(new QueryCommand(queryParams));

  const posters = (result.Items || []) as Poster[];
  const lastEvaluatedKey = result.LastEvaluatedKey;

  return {
    posters,
    nextCursor: lastEvaluatedKey
      ? Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64')
      : null,
    hasMore: !!lastEvaluatedKey
  };
}
```

### Step 4: Export types from db package

**File:** `packages/db/src/index.ts`

Update exports:

```typescript
export type { GetUserPostersOptions, GetUserPostersResult } from './repositories/poster-repository';
```

### Step 5: Run test (expect PASS)

```bash
cd packages/db
pnpm test src/repositories/__tests__/poster-repository.test.ts
```

**Expected output:** PASS

### Step 6: Commit

```bash
git add packages/db/src/repositories/poster-repository.ts packages/db/src/repositories/__tests__/poster-repository.test.ts packages/db/src/index.ts
git commit -m "feat(db): add getUserPosters method with pagination"
```

---

## Task 2: Get User Posters Handler

### Step 1: Write failing test

**File:** `apps/api/src/handlers/posters/__tests__/get-user-posters.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../get-user-posters';
import { APIGatewayProxyEvent } from 'aws-lambda';

vi.mock('@bjj-poster/db');

describe('get-user-posters handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    const event = {
      requestContext: {}
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).error).toBe('Unauthorized');
  });

  it('returns user posters successfully', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request',
        authorizer: {
          claims: { sub: 'user123' }
        }
      },
      queryStringParameters: { limit: '20' }
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.posters).toBeDefined();
    expect(body.nextCursor).toBeDefined();
    expect(body.hasMore).toBeDefined();
  });

  it('respects limit parameter', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request',
        authorizer: { claims: { sub: 'user123' } }
      },
      queryStringParameters: { limit: '10' }
    } as any;

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });

  it('filters by belt rank', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request',
        authorizer: { claims: { sub: 'user123' } }
      },
      queryStringParameters: {
        limit: '20',
        beltRank: 'Black'
      }
    } as any;

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });

  it('handles pagination cursor', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request',
        authorizer: { claims: { sub: 'user123' } }
      },
      queryStringParameters: {
        limit: '20',
        cursor: 'eyJQSyI6IlVTRVIjdXNlcjEyMyJ9'
      }
    } as any;

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});
```

### Step 2: Run test (expect FAIL)

```bash
cd apps/api
pnpm test src/handlers/posters/__tests__/get-user-posters.test.ts
```

**Expected output:** FAIL - handler not defined

### Step 3: Implement handler

**File:** `apps/api/src/handlers/posters/get-user-posters.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '@bjj-poster/core';
import { posterRepository } from '@bjj-poster/db';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  logger.info('Get user posters request', { requestId });

  try {
    // 1. Extract userId from JWT
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // 2. Parse query parameters
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || '20'),
      100
    );
    const cursor = event.queryStringParameters?.cursor;
    const beltRank = event.queryStringParameters?.beltRank;

    // 3. Fetch posters with pagination
    const result = await posterRepository.getUserPosters({
      userId,
      limit,
      cursor,
      beltRank
    });

    // 4. Return response
    logger.info('Posters fetched successfully', {
      requestId,
      userId,
      count: result.posters.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    logger.error('Failed to fetch posters', { requestId, error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Failed to fetch posters'
      })
    };
  }
};
```

### Step 4: Run test (expect PASS)

```bash
cd apps/api
pnpm test src/handlers/posters/__tests__/get-user-posters.test.ts
```

**Expected output:** PASS

### Step 5: Run integration test with LocalStack

```bash
pnpm test:integration
```

**Expected output:** PASS

### Step 6: Commit

```bash
git add apps/api/src/handlers/posters/get-user-posters.ts apps/api/src/handlers/posters/__tests__/get-user-posters.test.ts
git commit -m "feat(api): implement get user posters Lambda handler"
```

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-01-15-get-user-posters-api-handler.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
