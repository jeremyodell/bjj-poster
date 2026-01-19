# Get User Posters API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement GET `/api/posters` endpoint with cursor-based pagination and belt rank filtering.

**Architecture:** Handler extracts userId from auth context, validates query params, calls repository, transforms results with signed URLs, returns paginated response.

**Tech Stack:** TypeScript, Vitest, AWS Lambda, DynamoDB, Zod validation

---

## Task 1: Add Pagination Types to Poster Entity

**Files:**
- Modify: `packages/db/src/entities/poster.ts`

**Step 1: Add pagination types to poster.ts**

Add after line 69 (after `CreatePosterInput`):

```typescript
export interface PaginatedPostersOptions {
  limit?: number;
  cursor?: string;
  beltRank?: BeltRank;
}

export interface PaginatedPostersResult {
  items: Poster[];
  nextCursor: string | null;
}
```

**Step 2: Verify types compile**

Run: `pnpm type-check --filter @bjj-poster/db`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/db/src/entities/poster.ts
git commit -m "feat(db): add pagination types for poster queries"
```

---

## Task 2: Export Pagination Types from DB Package

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Add exports**

Update the poster type exports (around line 34-40) to include new types:

```typescript
export type {
  Poster,
  PosterItem,
  BeltRank,
  PosterStatus,
  CreatePosterInput,
  PaginatedPostersOptions,
  PaginatedPostersResult,
} from './entities/poster.js';
```

**Step 2: Verify exports compile**

Run: `pnpm type-check --filter @bjj-poster/db`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "feat(db): export pagination types"
```

---

## Task 3: Write Failing Test for getByUserIdPaginated

**Files:**
- Modify: `packages/db/src/repositories/__tests__/poster-repository.test.ts`

**Step 1: Add test for basic pagination**

Add new describe block after the existing `countForCurrentMonth` tests:

```typescript
describe('getByUserIdPaginated', () => {
  it('returns paginated posters with nextCursor when more items exist', async () => {
    const items = [
      {
        PK: 'USER#user-123',
        SK: 'POSTER#2026-01-18T12:00:00.000Z#pstr_1',
        posterId: 'pstr_1',
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'Worlds',
        tournamentDate: 'June 2026',
        status: 'completed',
        imageKey: 'posters/user-123/pstr_1/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
        createdAt: '2026-01-18T12:00:00.000Z',
        updatedAt: '2026-01-18T12:00:00.000Z',
      },
      {
        PK: 'USER#user-123',
        SK: 'POSTER#2026-01-17T12:00:00.000Z#pstr_2',
        posterId: 'pstr_2',
        userId: 'user-123',
        templateId: 'modern',
        athleteName: 'João Silva',
        beltRank: 'purple',
        tournamentName: 'Pans',
        tournamentDate: 'March 2026',
        status: 'completed',
        imageKey: 'posters/user-123/pstr_2/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_2/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_2/photo.jpg',
        createdAt: '2026-01-17T12:00:00.000Z',
        updatedAt: '2026-01-17T12:00:00.000Z',
      },
      {
        PK: 'USER#user-123',
        SK: 'POSTER#2026-01-16T12:00:00.000Z#pstr_3',
        posterId: 'pstr_3',
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'Europeans',
        tournamentDate: 'January 2026',
        status: 'completed',
        imageKey: 'posters/user-123/pstr_3/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_3/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_3/photo.jpg',
        createdAt: '2026-01-16T12:00:00.000Z',
        updatedAt: '2026-01-16T12:00:00.000Z',
      },
    ];

    // Return limit+1 items to indicate more exist
    mockSend.mockResolvedValueOnce({ Items: items });

    const result = await repo.getByUserIdPaginated('user-123', { limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    expect(result.items[0].posterId).toBe('pstr_1');
    expect(result.items[1].posterId).toBe('pstr_2');
  });

  it('returns null nextCursor when no more items', async () => {
    const items = [
      {
        PK: 'USER#user-123',
        SK: 'POSTER#2026-01-18T12:00:00.000Z#pstr_1',
        posterId: 'pstr_1',
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'Worlds',
        tournamentDate: 'June 2026',
        status: 'completed',
        imageKey: 'posters/user-123/pstr_1/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
        createdAt: '2026-01-18T12:00:00.000Z',
        updatedAt: '2026-01-18T12:00:00.000Z',
      },
    ];

    mockSend.mockResolvedValueOnce({ Items: items });

    const result = await repo.getByUserIdPaginated('user-123', { limit: 2 });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it('uses default limit of 20', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    await repo.getByUserIdPaginated('user-123');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Limit: 21, // limit + 1
        }),
      })
    );
  });

  it('decodes cursor and sets ExclusiveStartKey', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const cursor = Buffer.from('POSTER#2026-01-17T12:00:00.000Z#pstr_2').toString('base64');
    await repo.getByUserIdPaginated('user-123', { cursor });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          ExclusiveStartKey: {
            PK: 'USER#user-123',
            SK: 'POSTER#2026-01-17T12:00:00.000Z#pstr_2',
          },
        }),
      })
    );
  });

  it('filters by beltRank when provided', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    await repo.getByUserIdPaginated('user-123', { beltRank: 'purple' });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          FilterExpression: 'beltRank = :beltRank',
          ExpressionAttributeValues: expect.objectContaining({
            ':beltRank': 'purple',
          }),
        }),
      })
    );
  });

  it('returns empty result when no posters exist', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const result = await repo.getByUserIdPaginated('user-123');

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter @bjj-poster/db -- poster-repository`
Expected: FAIL with "getByUserIdPaginated is not a function"

**Step 3: Commit failing test**

```bash
git add packages/db/src/repositories/__tests__/poster-repository.test.ts
git commit -m "test(db): add failing tests for getByUserIdPaginated"
```

---

## Task 4: Implement getByUserIdPaginated

**Files:**
- Modify: `packages/db/src/repositories/poster-repository.ts`

**Step 1: Add import for pagination types**

Update the import at line 10:

```typescript
import type {
  Poster,
  PosterItem,
  CreatePosterInput,
  PaginatedPostersOptions,
  PaginatedPostersResult,
  BeltRank,
} from '../entities/poster.js';
```

**Step 2: Add constants after DEFAULT_POSTER_QUERY_LIMIT (line 14)**

```typescript
const DEFAULT_PAGINATED_LIMIT = 20;
const MAX_PAGINATED_LIMIT = 50;
```

**Step 3: Add the method after getByUserId (after line 85)**

```typescript
/**
 * Get paginated posters for a user (newest first)
 *
 * Uses cursor-based pagination with Base64-encoded SK.
 * Optionally filters by belt rank using DynamoDB FilterExpression.
 */
async getByUserIdPaginated(
  userId: string,
  options: PaginatedPostersOptions = {}
): Promise<PaginatedPostersResult> {
  const limit = Math.min(
    options.limit || DEFAULT_PAGINATED_LIMIT,
    MAX_PAGINATED_LIMIT
  );

  // Build expression attribute values
  const expressionValues: Record<string, string> = {
    ':pk': `USER#${userId}`,
    ':sk': 'POSTER#',
  };

  // Build optional filter expression for belt rank
  let filterExpression: string | undefined;
  if (options.beltRank) {
    filterExpression = 'beltRank = :beltRank';
    expressionValues[':beltRank'] = options.beltRank;
  }

  // Decode cursor to ExclusiveStartKey if provided
  let exclusiveStartKey: Record<string, string> | undefined;
  if (options.cursor) {
    const decodedSK = Buffer.from(options.cursor, 'base64').toString('utf-8');
    exclusiveStartKey = {
      PK: `USER#${userId}`,
      SK: decodedSK,
    };
  }

  const result = await this.client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: expressionValues,
      FilterExpression: filterExpression,
      ExclusiveStartKey: exclusiveStartKey,
      ScanIndexForward: false, // Newest first
      Limit: limit + 1, // Fetch one extra to detect hasMore
    })
  );

  const items = (result.Items || []) as PosterItem[];

  // Check if there are more items
  const hasMore = items.length > limit;
  const returnItems = hasMore ? items.slice(0, limit) : items;

  // Encode next cursor from last returned item
  let nextCursor: string | null = null;
  if (hasMore && returnItems.length > 0) {
    const lastItem = returnItems[returnItems.length - 1];
    nextCursor = Buffer.from(lastItem.SK).toString('base64');
  }

  return {
    items: returnItems.map((item) => this.toEntity(item)),
    nextCursor,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test --filter @bjj-poster/db -- poster-repository`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/db/src/repositories/poster-repository.ts
git commit -m "feat(db): implement getByUserIdPaginated method"
```

---

## Task 5: Add Handler Response Types

**Files:**
- Modify: `apps/api/src/handlers/posters/types.ts`

**Step 1: Add response types after QuotaExceededResponse (after line 76)**

```typescript
/**
 * Poster item in list response
 */
export interface PosterListItem {
  id: string;
  templateId: string;
  athleteName: string;
  teamName?: string;
  beltRank: string;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation?: string;
  achievement?: string;
  status: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

/**
 * GET /api/posters response
 */
export interface GetUserPostersResponse {
  posters: PosterListItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  count: number;
}

/**
 * Valid belt ranks for filtering
 */
export const VALID_BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'] as const;
export type BeltRankFilter = typeof VALID_BELT_RANKS[number];

export function isValidBeltRank(value: string): value is BeltRankFilter {
  return VALID_BELT_RANKS.includes(value as BeltRankFilter);
}
```

**Step 2: Verify types compile**

Run: `pnpm type-check --filter api`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/handlers/posters/types.ts
git commit -m "feat(api): add get-user-posters response types"
```

---

## Task 6: Write Failing Handler Tests

**Files:**
- Create: `apps/api/src/handlers/posters/__tests__/get-user-posters.test.ts`

**Step 1: Create test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock db before importing handler
vi.mock('@bjj-poster/db', () => ({
  db: {
    posters: {
      getByUserIdPaginated: vi.fn(),
    },
  },
}));

import { handler } from '../get-user-posters.js';
import { db } from '@bjj-poster/db';

const mockPosters = [
  {
    posterId: 'pstr_1',
    userId: 'user-123',
    templateId: 'classic',
    athleteName: 'João Silva',
    teamName: 'Alliance',
    beltRank: 'purple',
    tournamentName: 'IBJJF Worlds',
    tournamentDate: 'June 2026',
    tournamentLocation: 'Las Vegas',
    achievement: 'Gold Medal',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_1/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
    createdAt: '2026-01-18T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
  },
  {
    posterId: 'pstr_2',
    userId: 'user-123',
    templateId: 'modern',
    athleteName: 'João Silva',
    beltRank: 'blue',
    tournamentName: 'Pans',
    tournamentDate: 'March 2026',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_2/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_2/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_2/photo.jpg',
    createdAt: '2026-01-17T12:00:00.000Z',
    updatedAt: '2026-01-17T12:00:00.000Z',
  },
];

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/posters',
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

describe('getUserPosters handler', () => {
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

  it('returns posters for authenticated user', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: mockPosters,
      nextCursor: null,
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.pagination.hasMore).toBe(false);
    expect(body.pagination.nextCursor).toBeNull();
  });

  it('includes imageUrl and thumbnailUrl in response', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: [mockPosters[0]],
      nextCursor: null,
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters[0]).toHaveProperty('imageUrl');
    expect(body.posters[0]).toHaveProperty('thumbnailUrl');
    expect(body.posters[0].imageUrl).toContain('posters/user-123/pstr_1/original.jpg');
    expect(body.posters[0].thumbnailUrl).toContain('posters/user-123/pstr_1/thumbnail.jpg');
  });

  it('passes limit parameter to repository', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const event = createEvent({
      queryStringParameters: { limit: '10' },
    });
    await handler(event, mockContext, () => {});

    expect(db.posters.getByUserIdPaginated).toHaveBeenCalledWith('user-123', {
      limit: 10,
      cursor: undefined,
      beltRank: undefined,
    });
  });

  it('returns 400 for limit below 1', async () => {
    const event = createEvent({
      queryStringParameters: { limit: '0' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(400);

    const body = JSON.parse(result!.body);
    expect(body.message).toContain('limit');
  });

  it('returns 400 for limit above 50', async () => {
    const event = createEvent({
      queryStringParameters: { limit: '100' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(400);

    const body = JSON.parse(result!.body);
    expect(body.message).toContain('limit');
  });

  it('passes cursor to repository', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const cursor = 'abc123cursor';
    const event = createEvent({
      queryStringParameters: { cursor },
    });
    await handler(event, mockContext, () => {});

    expect(db.posters.getByUserIdPaginated).toHaveBeenCalledWith('user-123', {
      limit: 20,
      cursor,
      beltRank: undefined,
    });
  });

  it('filters by beltRank when provided', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const event = createEvent({
      queryStringParameters: { beltRank: 'purple' },
    });
    await handler(event, mockContext, () => {});

    expect(db.posters.getByUserIdPaginated).toHaveBeenCalledWith('user-123', {
      limit: 20,
      cursor: undefined,
      beltRank: 'purple',
    });
  });

  it('returns 400 for invalid beltRank', async () => {
    const event = createEvent({
      queryStringParameters: { beltRank: 'invalid' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(400);

    const body = JSON.parse(result!.body);
    expect(body.message).toContain('beltRank');
  });

  it('returns empty array when no posters exist', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters).toEqual([]);
    expect(body.count).toBe(0);
  });

  it('returns pagination info when more pages exist', async () => {
    const nextCursor = 'next-page-cursor';
    vi.mocked(db.posters.getByUserIdPaginated).mockResolvedValue({
      items: mockPosters,
      nextCursor,
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.pagination.hasMore).toBe(true);
    expect(body.pagination.nextCursor).toBe(nextCursor);
  });

  it('returns 500 on repository error', async () => {
    vi.mocked(db.posters.getByUserIdPaginated).mockRejectedValue(
      new Error('Database error')
    );

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(500);

    const body = JSON.parse(result!.body);
    expect(body.message).toBe('Failed to retrieve posters');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter api -- get-user-posters`
Expected: FAIL (handler returns 501)

**Step 3: Commit failing tests**

```bash
git add apps/api/src/handlers/posters/__tests__/get-user-posters.test.ts
git commit -m "test(api): add failing tests for get-user-posters handler"
```

---

## Task 7: Implement Handler

**Files:**
- Modify: `apps/api/src/handlers/posters/get-user-posters.ts`

**Step 1: Replace placeholder with full implementation**

```typescript
/**
 * Get User Posters Handler
 *
 * GET /api/posters?limit=20&cursor=...&beltRank=purple
 *
 * Returns paginated list of user's posters with cursor-based pagination.
 * Supports optional filtering by belt rank.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '@bjj-poster/db';
import type { BeltRank } from '@bjj-poster/db';
import {
  type PosterListItem,
  type GetUserPostersResponse,
  VALID_BELT_RANKS,
  isValidBeltRank,
} from './types.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

// For now, generate simple URLs. In production, use signed CloudFront URLs.
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.bjjposter.app';

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

function generateImageUrl(imageKey: string): string {
  return `${CDN_BASE_URL}/${imageKey}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // Extract userId from auth context
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    console.log('Unauthorized request', { requestId });
    return createResponse(401, { message: 'Unauthorized' });
  }

  console.log('GetUserPosters handler invoked', {
    requestId,
    userId,
    queryParams: event.queryStringParameters,
  });

  try {
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse limit
    let limit = DEFAULT_LIMIT;
    if (queryParams.limit) {
      const parsedLimit = parseInt(queryParams.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < MIN_LIMIT || parsedLimit > MAX_LIMIT) {
        return createResponse(400, {
          message: `Invalid limit. Must be between ${MIN_LIMIT} and ${MAX_LIMIT}.`,
        });
      }
      limit = parsedLimit;
    }

    // Parse cursor (optional)
    const cursor = queryParams.cursor || undefined;

    // Parse and validate beltRank filter (optional)
    let beltRank: BeltRank | undefined;
    if (queryParams.beltRank) {
      if (!isValidBeltRank(queryParams.beltRank)) {
        return createResponse(400, {
          message: `Invalid beltRank. Must be one of: ${VALID_BELT_RANKS.join(', ')}`,
        });
      }
      beltRank = queryParams.beltRank;
    }

    // Call repository
    const result = await db.posters.getByUserIdPaginated(userId, {
      limit,
      cursor,
      beltRank,
    });

    // Transform to response format with URLs
    const posters: PosterListItem[] = result.items.map((poster) => ({
      id: poster.posterId,
      templateId: poster.templateId,
      athleteName: poster.athleteName,
      teamName: poster.teamName,
      beltRank: poster.beltRank,
      tournamentName: poster.tournamentName,
      tournamentDate: poster.tournamentDate,
      tournamentLocation: poster.tournamentLocation,
      achievement: poster.achievement,
      status: poster.status,
      imageUrl: generateImageUrl(poster.imageKey),
      thumbnailUrl: generateImageUrl(poster.thumbnailKey),
      createdAt: poster.createdAt,
    }));

    const response: GetUserPostersResponse = {
      posters,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
      },
      count: posters.length,
    };

    console.log('Posters retrieved', {
      requestId,
      userId,
      count: posters.length,
      hasMore: response.pagination.hasMore,
    });

    return createResponse(200, response);
  } catch (error) {
    console.error('GetUserPosters handler failed', { requestId, userId, error });
    return createResponse(500, { message: 'Failed to retrieve posters' });
  }
};
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test --filter api -- get-user-posters`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add apps/api/src/handlers/posters/get-user-posters.ts
git commit -m "feat(api): implement get-user-posters handler"
```

---

## Task 8: Write Integration Tests

**Files:**
- Create: `apps/api/src/handlers/posters/__tests__/get-user-posters.integration.test.ts`

**Step 1: Create integration test file**

```typescript
/**
 * Integration tests for get-user-posters handler
 *
 * These tests use LocalStack to verify real DynamoDB operations.
 * Run with: USE_LOCALSTACK=true pnpm test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Set environment before importing handler
process.env.USE_LOCALSTACK = 'true';
process.env.DYNAMODB_TABLE_NAME = 'bjj-poster-app-test';

// Dynamic import to ensure env vars are set first
const { handler } = await import('../get-user-posters.js');

const TABLE_NAME = 'bjj-poster-app-test';

const localClient = new DynamoDBClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const docClient = DynamoDBDocumentClient.from(localClient);

// Test data: 5 posters for user-123, 2 for user-456
const testPosters = [
  {
    PK: 'USER#user-123',
    SK: 'POSTER#2026-01-18T12:00:00.000Z#pstr_1',
    entityType: 'POSTER',
    posterId: 'pstr_1',
    userId: 'user-123',
    templateId: 'classic',
    athleteName: 'João Silva',
    beltRank: 'purple',
    tournamentName: 'IBJJF Worlds',
    tournamentDate: 'June 2026',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_1/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
    createdAt: '2026-01-18T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
  },
  {
    PK: 'USER#user-123',
    SK: 'POSTER#2026-01-17T12:00:00.000Z#pstr_2',
    entityType: 'POSTER',
    posterId: 'pstr_2',
    userId: 'user-123',
    templateId: 'modern',
    athleteName: 'João Silva',
    beltRank: 'blue',
    tournamentName: 'Pans',
    tournamentDate: 'March 2026',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_2/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_2/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_2/photo.jpg',
    createdAt: '2026-01-17T12:00:00.000Z',
    updatedAt: '2026-01-17T12:00:00.000Z',
  },
  {
    PK: 'USER#user-123',
    SK: 'POSTER#2026-01-16T12:00:00.000Z#pstr_3',
    entityType: 'POSTER',
    posterId: 'pstr_3',
    userId: 'user-123',
    templateId: 'classic',
    athleteName: 'João Silva',
    beltRank: 'purple',
    tournamentName: 'Europeans',
    tournamentDate: 'January 2026',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_3/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_3/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_3/photo.jpg',
    createdAt: '2026-01-16T12:00:00.000Z',
    updatedAt: '2026-01-16T12:00:00.000Z',
  },
  {
    PK: 'USER#user-123',
    SK: 'POSTER#2026-01-15T12:00:00.000Z#pstr_4',
    entityType: 'POSTER',
    posterId: 'pstr_4',
    userId: 'user-123',
    templateId: 'minimal',
    athleteName: 'João Silva',
    beltRank: 'blue',
    tournamentName: 'Brasileiros',
    tournamentDate: 'April 2026',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_4/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_4/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_4/photo.jpg',
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
  {
    PK: 'USER#user-123',
    SK: 'POSTER#2026-01-14T12:00:00.000Z#pstr_5',
    entityType: 'POSTER',
    posterId: 'pstr_5',
    userId: 'user-123',
    templateId: 'classic',
    athleteName: 'João Silva',
    beltRank: 'white',
    tournamentName: 'Local Open',
    tournamentDate: 'December 2025',
    status: 'completed',
    imageKey: 'posters/user-123/pstr_5/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_5/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_5/photo.jpg',
    createdAt: '2026-01-14T12:00:00.000Z',
    updatedAt: '2026-01-14T12:00:00.000Z',
  },
  // Different user's posters - should not be visible
  {
    PK: 'USER#user-456',
    SK: 'POSTER#2026-01-18T10:00:00.000Z#pstr_other',
    entityType: 'POSTER',
    posterId: 'pstr_other',
    userId: 'user-456',
    templateId: 'classic',
    athleteName: 'Other User',
    beltRank: 'black',
    tournamentName: 'ADCC',
    tournamentDate: 'September 2026',
    status: 'completed',
    imageKey: 'posters/user-456/pstr_other/original.jpg',
    thumbnailKey: 'posters/user-456/pstr_other/thumbnail.jpg',
    uploadKey: 'uploads/user-456/pstr_other/photo.jpg',
    createdAt: '2026-01-18T10:00:00.000Z',
    updatedAt: '2026-01-18T10:00:00.000Z',
  },
];

function createEvent(
  userId: string,
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/posters',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'integration-test-request',
      authorizer: {
        claims: {
          sub: userId,
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

describe('getUserPosters handler (integration)', () => {
  beforeAll(async () => {
    // Create test table
    try {
      await localClient.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        })
      );
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    }

    // Seed test data
    for (const poster of testPosters) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: poster,
        })
      );
    }
  });

  afterAll(async () => {
    try {
      await localClient.send(
        new DeleteTableCommand({
          TableName: TABLE_NAME,
        })
      );
    } catch {
      // Ignore cleanup errors
    }
  });

  it('retrieves all posters for user (newest first)', async () => {
    const event = createEvent('user-123');
    const result = await handler(event, mockContext, () => {});

    expect(result).toBeDefined();
    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters).toHaveLength(5);
    expect(body.count).toBe(5);

    // Verify newest first ordering
    expect(body.posters[0].id).toBe('pstr_1');
    expect(body.posters[4].id).toBe('pstr_5');
  });

  it('paginates correctly with limit=2', async () => {
    // Page 1
    const event1 = createEvent('user-123', {
      queryStringParameters: { limit: '2' },
    });
    const result1 = await handler(event1, mockContext, () => {});

    expect(result1!.statusCode).toBe(200);
    const body1 = JSON.parse(result1!.body);

    expect(body1.posters).toHaveLength(2);
    expect(body1.pagination.hasMore).toBe(true);
    expect(body1.pagination.nextCursor).toBeTruthy();
    expect(body1.posters[0].id).toBe('pstr_1');
    expect(body1.posters[1].id).toBe('pstr_2');

    // Page 2
    const event2 = createEvent('user-123', {
      queryStringParameters: { limit: '2', cursor: body1.pagination.nextCursor },
    });
    const result2 = await handler(event2, mockContext, () => {});

    expect(result2!.statusCode).toBe(200);
    const body2 = JSON.parse(result2!.body);

    expect(body2.posters).toHaveLength(2);
    expect(body2.pagination.hasMore).toBe(true);
    expect(body2.posters[0].id).toBe('pstr_3');
    expect(body2.posters[1].id).toBe('pstr_4');

    // Page 3 (last)
    const event3 = createEvent('user-123', {
      queryStringParameters: { limit: '2', cursor: body2.pagination.nextCursor },
    });
    const result3 = await handler(event3, mockContext, () => {});

    expect(result3!.statusCode).toBe(200);
    const body3 = JSON.parse(result3!.body);

    expect(body3.posters).toHaveLength(1);
    expect(body3.pagination.hasMore).toBe(false);
    expect(body3.pagination.nextCursor).toBeNull();
    expect(body3.posters[0].id).toBe('pstr_5');
  });

  it('filters by belt rank correctly', async () => {
    const event = createEvent('user-123', {
      queryStringParameters: { beltRank: 'purple' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters).toHaveLength(2);
    expect(body.posters.every((p: { beltRank: string }) => p.beltRank === 'purple')).toBe(true);
  });

  it('enforces user isolation - cannot see other user posters', async () => {
    const event = createEvent('user-123');
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    // Should only see user-123's posters, not user-456's
    expect(body.posters.every((p: { id: string }) => !p.id.includes('other'))).toBe(true);
    expect(body.count).toBe(5);
  });

  it('returns empty for user with no posters', async () => {
    const event = createEvent('user-999');
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.posters).toEqual([]);
    expect(body.count).toBe(0);
  });
});
```

**Step 2: Run integration tests**

Run: `pnpm test:integration --filter api -- get-user-posters`
Expected: All tests PASS (requires LocalStack running)

**Step 3: Commit**

```bash
git add apps/api/src/handlers/posters/__tests__/get-user-posters.integration.test.ts
git commit -m "test(api): add get-user-posters integration tests"
```

---

## Task 9: Final Verification

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 4: Final commit if any fixes needed**

If any issues were found and fixed:
```bash
git add -A
git commit -m "fix: address lint/type issues"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `packages/db/src/entities/poster.ts` | Add pagination types |
| 2 | `packages/db/src/index.ts` | Export new types |
| 3 | `packages/db/.../poster-repository.test.ts` | Failing repository tests |
| 4 | `packages/db/.../poster-repository.ts` | Implement getByUserIdPaginated |
| 5 | `apps/api/.../posters/types.ts` | Add response types |
| 6 | `apps/api/.../__tests__/get-user-posters.test.ts` | Failing handler tests |
| 7 | `apps/api/.../get-user-posters.ts` | Implement handler |
| 8 | `apps/api/.../__tests__/get-user-posters.integration.test.ts` | Integration tests |
| 9 | - | Final verification |
