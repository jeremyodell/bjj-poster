# User Profile API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement GET /api/user/profile endpoint returning user profile with subscription tier and quota information.

**Architecture:** Simple read handler using existing UserRepository methods. Adds lastActiveAt tracking with fire-and-forget update. Returns default free tier for users not yet in DB.

**Tech Stack:** TypeScript, AWS Lambda, DynamoDB, Vitest

---

## Task 1: Add lastActiveAt to User Entity

**Files:**
- Modify: `packages/db/src/entities/user.ts`

**Step 1: Add lastActiveAt field to User interface**

In `packages/db/src/entities/user.ts`, add after line 20 (`usageResetAt?: string;`):

```typescript
  lastActiveAt?: string;
```

**Step 2: Add lastActiveAt field to UserItem interface**

In same file, add after line 39 (`usageResetAt?: string;`):

```typescript
  lastActiveAt?: string;
```

**Step 3: Verify types compile**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/db/src/entities/user.ts
git commit -m "feat(db): add lastActiveAt field to User entity"
```

---

## Task 2: Add updateLastActiveAt to UserRepository

**Files:**
- Modify: `packages/db/src/repositories/user-repository.ts`

**Step 1: Add updateLastActiveAt method**

Add after the `toEntity` method (around line 450):

```typescript
  /**
   * Update user's lastActiveAt timestamp.
   * Called fire-and-forget from profile endpoint for activity tracking.
   */
  async updateLastActiveAt(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET lastActiveAt = :now, updatedAt = :now',
        ExpressionAttributeValues: {
          ':now': now,
        },
      })
    );
  }
```

**Step 2: Update toEntity to include lastActiveAt**

In the `toEntity` method, add `lastActiveAt` to the returned object:

```typescript
  private toEntity(item: UserItem): User {
    return {
      userId: item.userId,
      email: item.email,
      name: item.name,
      subscriptionTier: item.subscriptionTier,
      stripeCustomerId: item.stripeCustomerId,
      stripeSubscriptionId: item.stripeSubscriptionId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      postersThisMonth: item.postersThisMonth,
      usageResetAt: item.usageResetAt,
      lastActiveAt: item.lastActiveAt,
    };
  }
```

**Step 3: Verify types compile**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/db/src/repositories/user-repository.ts
git commit -m "feat(db): add updateLastActiveAt method to UserRepository"
```

---

## Task 3: Add Response Types for Get Profile Handler

**Files:**
- Create: `apps/api/src/handlers/user/types.ts`

**Step 1: Create types file**

```typescript
/**
 * Get Profile Response Types
 *
 * GET /api/user/profile
 */

import type { SubscriptionTier } from '@bjj-poster/db';

export interface UserProfileData {
  id: string;
  email: string;
  name?: string;
}

export interface SubscriptionData {
  tier: SubscriptionTier;
}

export interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export interface GetProfileResponse {
  user: UserProfileData;
  subscription: SubscriptionData;
  quota: QuotaData;
}
```

**Step 2: Verify types compile**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/handlers/user/types.ts
git commit -m "feat(api): add get-profile response types"
```

---

## Task 4: Write Failing Tests for Get Profile Handler

**Files:**
- Create: `apps/api/src/handlers/user/__tests__/get-profile.test.ts`

**Step 1: Create test file with all test cases**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock db before importing handler
vi.mock('@bjj-poster/db', () => ({
  db: {
    users: {
      getById: vi.fn(),
      getUsage: vi.fn(),
      updateLastActiveAt: vi.fn(),
    },
  },
}));

import { handler } from '../get-profile.js';
import { db } from '@bjj-poster/db';

const mockUser = {
  userId: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  subscriptionTier: 'pro' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

const mockUsage = {
  allowed: true,
  used: 5,
  limit: 20,
  remaining: 15,
  resetsAt: '2026-02-01T00:00:00.000Z',
};

function createEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/user/profile',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-id',
      authorizer: {
        claims: {
          sub: 'user-123',
          email: 'test@example.com',
        },
      },
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext = {} as Context;

describe('getProfile handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no auth token', async () => {
    const event = createEvent({
      requestContext: {
        requestId: 'test-request-id',
      } as APIGatewayProxyEvent['requestContext'],
    });

    const result = await handler(event, mockContext, () => {});

    expect(result).toBeDefined();
    expect(result!.statusCode).toBe(401);

    const body = JSON.parse(result!.body);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns profile for authenticated user', async () => {
    vi.mocked(db.users.getById).mockResolvedValue(mockUser);
    vi.mocked(db.users.getUsage).mockResolvedValue(mockUsage);
    vi.mocked(db.users.updateLastActiveAt).mockResolvedValue(undefined);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe('user-123');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.name).toBe('Test User');
    expect(body.subscription.tier).toBe('pro');
    expect(body.quota.used).toBe(5);
    expect(body.quota.limit).toBe(20);
    expect(body.quota.remaining).toBe(15);
    expect(body.quota.resetsAt).toBe('2026-02-01T00:00:00.000Z');
  });

  it('returns default free tier when user not in DB', async () => {
    vi.mocked(db.users.getById).mockResolvedValue(null);
    vi.mocked(db.users.getUsage).mockResolvedValue({
      allowed: true,
      used: 0,
      limit: 2,
      remaining: 2,
      resetsAt: '2026-02-01T00:00:00.000Z',
    });
    vi.mocked(db.users.updateLastActiveAt).mockResolvedValue(undefined);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe('user-123');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.name).toBeUndefined();
    expect(body.subscription.tier).toBe('free');
    expect(body.quota.used).toBe(0);
    expect(body.quota.limit).toBe(2);
  });

  it('calls updateLastActiveAt for existing user', async () => {
    vi.mocked(db.users.getById).mockResolvedValue(mockUser);
    vi.mocked(db.users.getUsage).mockResolvedValue(mockUsage);
    vi.mocked(db.users.updateLastActiveAt).mockResolvedValue(undefined);

    const event = createEvent();
    await handler(event, mockContext, () => {});

    expect(db.users.updateLastActiveAt).toHaveBeenCalledWith('user-123');
  });

  it('does not call updateLastActiveAt for new user', async () => {
    vi.mocked(db.users.getById).mockResolvedValue(null);
    vi.mocked(db.users.getUsage).mockResolvedValue({
      allowed: true,
      used: 0,
      limit: 2,
      remaining: 2,
      resetsAt: '2026-02-01T00:00:00.000Z',
    });

    const event = createEvent();
    await handler(event, mockContext, () => {});

    expect(db.users.updateLastActiveAt).not.toHaveBeenCalled();
  });

  it('returns 500 on database error', async () => {
    vi.mocked(db.users.getById).mockRejectedValue(new Error('DB error'));

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(500);

    const body = JSON.parse(result!.body);
    expect(body.message).toBe('Failed to retrieve profile');
  });

  it('succeeds even if updateLastActiveAt fails', async () => {
    vi.mocked(db.users.getById).mockResolvedValue(mockUser);
    vi.mocked(db.users.getUsage).mockResolvedValue(mockUsage);
    vi.mocked(db.users.updateLastActiveAt).mockRejectedValue(
      new Error('Update failed')
    );

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    // Should still return 200 since updateLastActiveAt is fire-and-forget
    expect(result!.statusCode).toBe(200);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test apps/api/src/handlers/user/__tests__/get-profile.test.ts`
Expected: FAIL (handler not implemented yet)

**Step 3: Commit failing tests**

```bash
git add apps/api/src/handlers/user/__tests__/get-profile.test.ts
git commit -m "test(api): add failing tests for get-profile handler"
```

---

## Task 5: Implement Get Profile Handler

**Files:**
- Modify: `apps/api/src/handlers/user/get-profile.ts`

**Step 1: Replace placeholder with implementation**

```typescript
/**
 * Get User Profile Handler
 *
 * GET /api/user/profile
 *
 * Returns authenticated user's profile data including subscription
 * tier and quota information.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '@bjj-poster/db';
import type { GetProfileResponse } from './types.js';

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // Extract userId from auth context
  const userId = event.requestContext.authorizer?.claims?.sub;
  const email = event.requestContext.authorizer?.claims?.email;

  if (!userId) {
    console.log('Unauthorized request', { requestId });
    return createResponse(401, { message: 'Unauthorized' });
  }

  console.log('GetProfile handler invoked', { requestId, userId });

  try {
    // Fetch user and usage in parallel
    const [user, usage] = await Promise.all([
      db.users.getById(userId),
      db.users.getUsage(userId),
    ]);

    // Fire-and-forget: update lastActiveAt for existing users
    if (user) {
      db.users.updateLastActiveAt(userId).catch((err) => {
        console.warn('Failed to update lastActiveAt', { requestId, userId, error: err });
      });
    }

    const response: GetProfileResponse = {
      user: {
        id: userId,
        email: user?.email || email || '',
        name: user?.name,
      },
      subscription: {
        tier: user?.subscriptionTier || 'free',
      },
      quota: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        resetsAt: usage.resetsAt,
      },
    };

    console.log('Profile retrieved', { requestId, userId, tier: response.subscription.tier });

    return createResponse(200, response);
  } catch (error) {
    console.error('GetProfile handler failed', { requestId, userId, error });
    return createResponse(500, { message: 'Failed to retrieve profile' });
  }
};
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test apps/api/src/handlers/user/__tests__/get-profile.test.ts`
Expected: PASS (all 7 tests)

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/handlers/user/get-profile.ts
git commit -m "feat(api): implement get-profile handler"
```

---

## Task 6: Add Integration Tests

**Files:**
- Create: `apps/api/src/handlers/user/__tests__/get-profile.integration.test.ts`

**Step 1: Create integration test file**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { db, createTestUser, deleteTestUser } from '@bjj-poster/db';
import { handler } from '../get-profile.js';

const TEST_USER_ID = 'integration-test-user-profile';

function createEvent(userId: string | null): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/user/profile',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'integration-test-request',
      authorizer: userId
        ? {
            claims: {
              sub: userId,
              email: 'integration@test.com',
            },
          }
        : undefined,
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
  };
}

const mockContext = {} as Context;

describe('getProfile integration tests', () => {
  beforeAll(async () => {
    // Create test user with pro tier
    await createTestUser({
      userId: TEST_USER_ID,
      email: 'integration@test.com',
      name: 'Integration Test User',
      subscriptionTier: 'pro',
    });
  });

  afterAll(async () => {
    await deleteTestUser(TEST_USER_ID);
  });

  it('returns profile from DynamoDB', async () => {
    const event = createEvent(TEST_USER_ID);
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe(TEST_USER_ID);
    expect(body.user.email).toBe('integration@test.com');
    expect(body.user.name).toBe('Integration Test User');
    expect(body.subscription.tier).toBe('pro');
    expect(body.quota).toHaveProperty('used');
    expect(body.quota).toHaveProperty('limit');
    expect(body.quota).toHaveProperty('remaining');
    expect(body.quota).toHaveProperty('resetsAt');
  });

  it('updates lastActiveAt in database', async () => {
    const beforeUser = await db.users.getById(TEST_USER_ID);
    const beforeLastActive = beforeUser?.lastActiveAt;

    // Small delay to ensure timestamp differs
    await new Promise((resolve) => setTimeout(resolve, 100));

    const event = createEvent(TEST_USER_ID);
    await handler(event, mockContext, () => {});

    // Give fire-and-forget time to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const afterUser = await db.users.getById(TEST_USER_ID);
    expect(afterUser?.lastActiveAt).toBeDefined();

    if (beforeLastActive) {
      expect(new Date(afterUser!.lastActiveAt!).getTime()).toBeGreaterThan(
        new Date(beforeLastActive).getTime()
      );
    }
  });

  it('returns default profile for non-existent user', async () => {
    const event = createEvent('non-existent-user-id');
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe('non-existent-user-id');
    expect(body.subscription.tier).toBe('free');
    expect(body.quota.limit).toBe(2); // Free tier limit
  });
});
```

**Step 2: Check if test helpers exist, if not skip integration tests for now**

Run: `pnpm test:integration apps/api/src/handlers/user/__tests__/get-profile.integration.test.ts`

Note: If `createTestUser`/`deleteTestUser` don't exist, we'll need to add them or adjust the test. Check existing integration tests for patterns.

**Step 3: Commit**

```bash
git add apps/api/src/handlers/user/__tests__/get-profile.integration.test.ts
git commit -m "test(api): add get-profile integration tests"
```

---

## Task 7: Final Verification

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run linting**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 4: Test endpoint locally**

Run: `pnpm dev` (in separate terminal)
Then: `curl http://localhost:3001/api/user/profile`
Expected: 401 Unauthorized (no auth token - correct behavior)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add lastActiveAt to User entity | `packages/db/src/entities/user.ts` |
| 2 | Add updateLastActiveAt method | `packages/db/src/repositories/user-repository.ts` |
| 3 | Add response types | `apps/api/src/handlers/user/types.ts` |
| 4 | Write failing tests | `apps/api/src/handlers/user/__tests__/get-profile.test.ts` |
| 5 | Implement handler | `apps/api/src/handlers/user/get-profile.ts` |
| 6 | Integration tests | `apps/api/src/handlers/user/__tests__/get-profile.integration.test.ts` |
| 7 | Final verification | - |
