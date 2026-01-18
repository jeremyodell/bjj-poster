# Generate Poster API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement POST `/api/posters/generate` endpoint that accepts multipart form data, generates a BJJ tournament poster using `composePoster`, stores it in S3, and saves metadata to DynamoDB.

**Architecture:** Lambda handler validates auth and quota, parses multipart form data, calls `composePoster()` from @bjj-poster/core, generates thumbnail with Sharp, uploads both to S3 in parallel, saves poster metadata to DynamoDB, increments user usage, and returns full poster object with usage stats.

**Tech Stack:** TypeScript, AWS Lambda, S3, DynamoDB, Sharp, busboy (multipart parsing), Zod (validation), Vitest (testing)

---

## Task 1: Create Poster Entity Type

**Files:**
- Create: `packages/db/src/entities/poster.ts`

**Step 1: Create the poster entity type file**

```typescript
/**
 * Poster Entity Types
 *
 * Represents generated poster data in DynamoDB.
 * Key pattern: PK=USER#<userId>, SK=POSTER#<timestamp>#<posterId>
 */

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type PosterStatus = 'completed' | 'failed';

export interface Poster {
  posterId: string;
  userId: string;
  templateId: string;
  status: PosterStatus;
  athleteName: string;
  teamName?: string;
  beltRank: BeltRank;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation?: string;
  achievement?: string;
  imageKey: string;
  thumbnailKey: string;
  uploadKey: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DynamoDB item structure for Poster
 */
export interface PosterItem {
  PK: string; // USER#<userId>
  SK: string; // POSTER#<timestamp>#<posterId>
  entityType: 'POSTER';
  posterId: string;
  userId: string;
  templateId: string;
  status: PosterStatus;
  athleteName: string;
  teamName?: string;
  beltRank: BeltRank;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation?: string;
  achievement?: string;
  imageKey: string;
  thumbnailKey: string;
  uploadKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePosterInput {
  userId: string;
  templateId: string;
  athleteName: string;
  teamName?: string;
  beltRank: BeltRank;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation?: string;
  achievement?: string;
  imageKey: string;
  thumbnailKey: string;
  uploadKey: string;
}
```

**Step 2: Run type-check**

```bash
cd packages/db && pnpm type-check
```

Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add packages/db/src/entities/poster.ts
git commit -m "feat(db): add Poster entity type"
```

---

## Task 2: Implement Poster Repository

**Files:**
- Modify: `packages/db/src/repositories/poster-repository.ts`
- Create: `packages/db/src/repositories/__tests__/poster-repository.test.ts`

**Step 1: Write failing test for create method**

Create `packages/db/src/repositories/__tests__/poster-repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterRepository } from '../poster-repository.js';
import type { CreatePosterInput } from '../../entities/poster.js';

// Mock DynamoDB client
const mockSend = vi.fn();
const mockClient = { send: mockSend } as any;

describe('PosterRepository', () => {
  let repo: PosterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PosterRepository(mockClient);
  });

  describe('create', () => {
    it('creates a poster with correct keys', async () => {
      mockSend.mockResolvedValueOnce({});

      const input: CreatePosterInput = {
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'World Championship',
        tournamentDate: 'June 2025',
        imageKey: 'posters/user-123/pstr_abc/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_abc/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_abc/photo.jpg',
      };

      const poster = await repo.create(input);

      expect(poster.userId).toBe('user-123');
      expect(poster.athleteName).toBe('João Silva');
      expect(poster.status).toBe('completed');
      expect(poster.posterId).toMatch(/^pstr_/);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getByUserId', () => {
    it('returns posters for a user', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'USER#user-123',
            SK: 'POSTER#2026-01-16T00:00:00.000Z#pstr_abc',
            posterId: 'pstr_abc',
            userId: 'user-123',
            templateId: 'classic',
            athleteName: 'João Silva',
            beltRank: 'blue',
            tournamentName: 'World Championship',
            tournamentDate: 'June 2025',
            status: 'completed',
            imageKey: 'posters/user-123/pstr_abc/original.jpg',
            thumbnailKey: 'posters/user-123/pstr_abc/thumbnail.jpg',
            uploadKey: 'uploads/user-123/pstr_abc/photo.jpg',
            createdAt: '2026-01-16T00:00:00.000Z',
            updatedAt: '2026-01-16T00:00:00.000Z',
          },
        ],
      });

      const posters = await repo.getByUserId('user-123');

      expect(posters).toHaveLength(1);
      expect(posters[0].posterId).toBe('pstr_abc');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/db && pnpm test -- poster-repository.test.ts
```

Expected: FAIL with "repo.create is not a function" or similar

**Step 3: Implement poster repository**

Replace `packages/db/src/repositories/poster-repository.ts`:

```typescript
/**
 * Poster Repository
 *
 * Handles all DynamoDB operations for posters.
 */

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { TABLE_NAME } from '../config.js';
import type { Poster, PosterItem, CreatePosterInput } from '../entities/poster.js';

export class PosterRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Create a new poster
   */
  async create(input: CreatePosterInput): Promise<Poster> {
    const now = new Date().toISOString();
    const posterId = `pstr_${nanoid(12)}`;

    const item: PosterItem = {
      PK: `USER#${input.userId}`,
      SK: `POSTER#${now}#${posterId}`,
      entityType: 'POSTER',
      posterId,
      userId: input.userId,
      templateId: input.templateId,
      status: 'completed',
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank,
      tournamentName: input.tournamentName,
      tournamentDate: input.tournamentDate,
      tournamentLocation: input.tournamentLocation,
      achievement: input.achievement,
      imageKey: input.imageKey,
      thumbnailKey: input.thumbnailKey,
      uploadKey: input.uploadKey,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return this.toEntity(item);
  }

  /**
   * Get all posters for a user (newest first)
   */
  async getByUserId(userId: string, limit = 50): Promise<Poster[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'POSTER#',
        },
        ScanIndexForward: false, // Newest first
        Limit: limit,
      })
    );

    return (result.Items || []).map((item) => this.toEntity(item as PosterItem));
  }

  /**
   * Count posters for a user in the current month
   */
  async countForCurrentMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const result = await this.client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK >= :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `POSTER#${startOfMonth.toISOString()}`,
        },
        Select: 'COUNT',
      })
    );

    return result.Count || 0;
  }

  private toEntity(item: PosterItem): Poster {
    return {
      posterId: item.posterId,
      userId: item.userId,
      templateId: item.templateId,
      status: item.status,
      athleteName: item.athleteName,
      teamName: item.teamName,
      beltRank: item.beltRank,
      tournamentName: item.tournamentName,
      tournamentDate: item.tournamentDate,
      tournamentLocation: item.tournamentLocation,
      achievement: item.achievement,
      imageKey: item.imageKey,
      thumbnailKey: item.thumbnailKey,
      uploadKey: item.uploadKey,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/db && pnpm test -- poster-repository.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/repositories/poster-repository.ts packages/db/src/repositories/__tests__/poster-repository.test.ts
git commit -m "feat(db): implement PosterRepository with create and query methods"
```

---

## Task 3: Export Poster Repository from Package

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Add poster exports**

Add to `packages/db/src/index.ts`:

After line 27 (after `UpdateSubscriptionInput` export):
```typescript
export type {
  Poster,
  PosterItem,
  BeltRank,
  PosterStatus,
  CreatePosterInput,
} from './entities/poster.js';
```

After line 38 (after `RateLimitRepository` export):
```typescript
export { PosterRepository } from './repositories/poster-repository.js';
```

Update the import section (around line 54):
```typescript
import { PosterRepository } from './repositories/poster-repository.js';
```

Update the db facade (around line 61):
```typescript
export const db = {
  templates: new TemplateRepository(dynamoClient),
  users: new UserRepository(dynamoClient),
  webhookEvents: new WebhookEventRepository(dynamoClient),
  rateLimits: new RateLimitRepository(dynamoClient),
  posters: new PosterRepository(dynamoClient),
};
```

**Step 2: Run type-check**

```bash
cd packages/db && pnpm type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "feat(db): export PosterRepository from package"
```

---

## Task 4: Add Usage Tracking to User Entity

**Files:**
- Modify: `packages/db/src/entities/user.ts`

**Step 1: Add usage fields to User interface**

Add to the `User` interface after `updatedAt`:
```typescript
  postersThisMonth?: number;
  usageResetAt?: string;
```

Add to `UserItem` interface after `updatedAt`:
```typescript
  postersThisMonth?: number;
  usageResetAt?: string;
```

**Step 2: Run type-check**

```bash
cd packages/db && pnpm type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/db/src/entities/user.ts
git commit -m "feat(db): add usage tracking fields to User entity"
```

---

## Task 5: Add Usage Methods to User Repository

**Files:**
- Modify: `packages/db/src/repositories/user-repository.ts`
- Create: `packages/db/src/repositories/__tests__/user-repository.test.ts`

**Step 1: Write failing test for checkAndIncrementUsage**

Create `packages/db/src/repositories/__tests__/user-repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../user-repository.js';

const mockSend = vi.fn();
const mockClient = { send: mockSend } as any;

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new UserRepository(mockClient);
  });

  describe('checkAndIncrementUsage', () => {
    it('allows usage when under limit', async () => {
      // Mock user with 1 poster this month, free tier (limit 2)
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 1,
            usageResetAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({}); // Update call

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('denies usage when at limit', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'USER#user-123',
          SK: 'PROFILE',
          userId: 'user-123',
          email: 'test@example.com',
          subscriptionTier: 'free',
          postersThisMonth: 2,
          usageResetAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('resets usage when past reset date', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 2,
            usageResetAt: pastDate,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({}); // Update call

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1); // Reset to 1 (new usage)
    });

    it('allows unlimited for premium tier', async () => {
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'premium',
            postersThisMonth: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({});

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1); // Unlimited
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/db && pnpm test -- user-repository.test.ts
```

Expected: FAIL with "repo.checkAndIncrementUsage is not a function"

**Step 3: Implement checkAndIncrementUsage method**

Add to `packages/db/src/repositories/user-repository.ts`:

Add import at top:
```typescript
import { UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
```

Add tier limits constant after imports:
```typescript
const TIER_LIMITS: Record<string, number> = {
  free: 2,
  pro: 20,
  premium: -1, // Unlimited
};
```

Add interface and method to the class:
```typescript
export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

// Add inside UserRepository class:

  /**
   * Check if user can create a poster and increment usage if allowed.
   * Handles monthly reset logic automatically.
   */
  async checkAndIncrementUsage(userId: string): Promise<UsageCheckResult> {
    const user = await this.getById(userId);

    if (!user) {
      // New user - create with initial usage
      const resetsAt = this.getNextResetDate();
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :count, usageResetAt = :reset, updatedAt = :now',
          ExpressionAttributeValues: {
            ':count': 1,
            ':reset': resetsAt,
            ':now': new Date().toISOString(),
          },
        })
      );

      const limit = TIER_LIMITS.free;
      return {
        allowed: true,
        used: 1,
        limit,
        remaining: limit - 1,
        resetsAt,
      };
    }

    const tier = user.subscriptionTier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const now = new Date();
    const resetsAt = user.usageResetAt || this.getNextResetDate();

    // Check if we need to reset (past reset date)
    const needsReset = !user.usageResetAt || new Date(user.usageResetAt) <= now;
    const currentUsage = needsReset ? 0 : (user.postersThisMonth || 0);

    // Unlimited tier (premium)
    if (limit === -1) {
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :count, updatedAt = :now',
          ExpressionAttributeValues: {
            ':count': currentUsage + 1,
            ':now': now.toISOString(),
          },
        })
      );

      return {
        allowed: true,
        used: currentUsage + 1,
        limit: -1,
        remaining: -1, // Unlimited
        resetsAt: needsReset ? this.getNextResetDate() : resetsAt,
      };
    }

    // Check if at limit
    if (currentUsage >= limit) {
      return {
        allowed: false,
        used: currentUsage,
        limit,
        remaining: 0,
        resetsAt: needsReset ? this.getNextResetDate() : resetsAt,
      };
    }

    // Increment usage
    const newUsage = currentUsage + 1;
    const newResetsAt = needsReset ? this.getNextResetDate() : resetsAt;

    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET postersThisMonth = :count, usageResetAt = :reset, updatedAt = :now',
        ExpressionAttributeValues: {
          ':count': newUsage,
          ':reset': newResetsAt,
          ':now': now.toISOString(),
        },
      })
    );

    return {
      allowed: true,
      used: newUsage,
      limit,
      remaining: limit - newUsage,
      resetsAt: newResetsAt,
    };
  }

  /**
   * Get usage stats without incrementing
   */
  async getUsage(userId: string): Promise<UsageCheckResult> {
    const user = await this.getById(userId);

    const tier = user?.subscriptionTier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const now = new Date();
    const resetsAt = user?.usageResetAt || this.getNextResetDate();
    const needsReset = !user?.usageResetAt || new Date(user.usageResetAt) <= now;
    const currentUsage = needsReset ? 0 : (user?.postersThisMonth || 0);

    return {
      allowed: limit === -1 || currentUsage < limit,
      used: currentUsage,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
      resetsAt: needsReset ? this.getNextResetDate() : resetsAt,
    };
  }

  private getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }
```

Also update `toEntity` to include the new fields:
```typescript
  private toEntity(item: UserItem): User {
    return {
      userId: item.userId,
      email: item.email,
      name: item.name,
      subscriptionTier: item.subscriptionTier,
      stripeCustomerId: item.stripeCustomerId,
      stripeSubscriptionId: item.stripeSubscriptionId,
      postersThisMonth: item.postersThisMonth,
      usageResetAt: item.usageResetAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/db && pnpm test -- user-repository.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/repositories/user-repository.ts packages/db/src/repositories/__tests__/user-repository.test.ts
git commit -m "feat(db): add usage tracking methods to UserRepository"
```

---

## Task 6: Export UsageCheckResult Type

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Export the new type**

Add after `UpdateSubscriptionInput` export:
```typescript
export type { UsageCheckResult } from './repositories/user-repository.js';
```

**Step 2: Run type-check**

```bash
cd packages/db && pnpm type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "feat(db): export UsageCheckResult type"
```

---

## Task 7: Create Multipart Parser Utility

**Files:**
- Create: `apps/api/src/lib/multipart.ts`
- Create: `apps/api/src/lib/__tests__/multipart.test.ts`

**Step 1: Install busboy dependency**

```bash
cd apps/api && pnpm add busboy && pnpm add -D @types/busboy
```

**Step 2: Write failing test**

Create `apps/api/src/lib/__tests__/multipart.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseMultipart } from '../multipart.js';

describe('parseMultipart', () => {
  it('parses form fields and file', async () => {
    // Create a simple multipart body
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
      `Content-Disposition: form-data; name="athleteName"`,
      ``,
      `João Silva`,
      `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
      `Content-Disposition: form-data; name="photo"; filename="test.jpg"`,
      `Content-Type: image/jpeg`,
      ``,
      `fake-image-data`,
      `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`
    );

    expect(result.fields.athleteName).toBe('João Silva');
    expect(result.file).toBeDefined();
    expect(result.file?.fieldname).toBe('photo');
    expect(result.file?.filename).toBe('test.jpg');
  });

  it('throws on missing content-type', async () => {
    await expect(parseMultipart('body', '')).rejects.toThrow();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd apps/api && pnpm test -- multipart.test.ts
```

Expected: FAIL with "Cannot find module '../multipart.js'"

**Step 4: Create lib directory and implement multipart parser**

Create `apps/api/src/lib/multipart.ts`:

```typescript
/**
 * Multipart Form Data Parser
 *
 * Parses multipart/form-data requests for Lambda handlers.
 */

import Busboy from 'busboy';
import { Readable } from 'stream';

export interface ParsedFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  file: ParsedFile | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function parseMultipart(
  body: string,
  contentType: string
): Promise<ParsedMultipart> {
  return new Promise((resolve, reject) => {
    if (!contentType || !contentType.includes('multipart/form-data')) {
      reject(new Error('Invalid content type: expected multipart/form-data'));
      return;
    }

    const fields: Record<string, string> = {};
    let file: ParsedFile | null = null;

    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE },
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        file = {
          fieldname,
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks),
        };
      });

      stream.on('limit', () => {
        reject(new Error(`File exceeds maximum size of ${MAX_FILE_SIZE} bytes`));
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, file });
    });

    busboy.on('error', (error: Error) => {
      reject(error);
    });

    // Convert body to stream and pipe to busboy
    const bodyStream = Readable.from(Buffer.from(body, 'binary'));
    bodyStream.pipe(busboy);
  });
}

/**
 * Parse multipart from base64-encoded body (API Gateway)
 */
export function parseMultipartBase64(
  body: string,
  contentType: string
): Promise<ParsedMultipart> {
  const decoded = Buffer.from(body, 'base64').toString('binary');
  return parseMultipart(decoded, contentType);
}
```

**Step 5: Run tests to verify they pass**

```bash
cd apps/api && pnpm test -- multipart.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/lib/multipart.ts apps/api/src/lib/__tests__/multipart.test.ts apps/api/package.json apps/api/pnpm-lock.yaml
git commit -m "feat(api): add multipart form data parser utility"
```

---

## Task 8: Create S3 Upload Helper

**Files:**
- Create: `apps/api/src/lib/s3.ts`

**Step 1: Create S3 helper**

Create `apps/api/src/lib/s3.ts`:

```typescript
/**
 * S3 Upload Helpers
 *
 * Provides utilities for uploading files to S3.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const isLocal = process.env.USE_LOCALSTACK === 'true';

export const s3Client = new S3Client(
  isLocal
    ? {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1',
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        forcePathStyle: true,
      }
    : { region: process.env.AWS_REGION || 'us-east-1' }
);

const BUCKET_NAME = process.env.POSTER_BUCKET_NAME || 'bjj-poster-app-posters';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload a buffer to S3
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `${CDN_URL}/${key}`,
  };
}

/**
 * Upload multiple files to S3 in parallel
 */
export async function uploadMultipleToS3(
  uploads: Array<{ key: string; buffer: Buffer; contentType: string }>
): Promise<UploadResult[]> {
  return Promise.all(
    uploads.map(({ key, buffer, contentType }) =>
      uploadToS3(key, buffer, contentType)
    )
  );
}

/**
 * Generate S3 keys for a poster
 */
export function generatePosterKeys(
  userId: string,
  posterId: string
): { imageKey: string; thumbnailKey: string; uploadKey: string } {
  return {
    imageKey: `posters/${userId}/${posterId}/original.jpg`,
    thumbnailKey: `posters/${userId}/${posterId}/thumbnail.jpg`,
    uploadKey: `uploads/${userId}/${posterId}/photo.jpg`,
  };
}
```

**Step 2: Install S3 SDK if not present**

```bash
cd apps/api && pnpm add @aws-sdk/client-s3
```

**Step 3: Run type-check**

```bash
cd apps/api && pnpm type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/lib/s3.ts apps/api/package.json
git commit -m "feat(api): add S3 upload helper utilities"
```

---

## Task 9: Create Generate Poster Handler Types

**Files:**
- Create: `apps/api/src/handlers/posters/types.ts`

**Step 1: Create Zod schemas and types**

Create `apps/api/src/handlers/posters/types.ts`:

```typescript
/**
 * Generate Poster Handler Types
 */

import { z } from 'zod';

export const beltRankSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black']);

export const generatePosterSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  athleteName: z.string().min(1, 'Athlete name is required').max(100),
  teamName: z.string().max(100).optional(),
  beltRank: beltRankSchema,
  tournamentName: z.string().min(1, 'Tournament name is required').max(200),
  tournamentDate: z.string().min(1, 'Tournament date is required').max(50),
  tournamentLocation: z.string().max(200).optional(),
  achievement: z.string().max(200).optional(),
});

export type GeneratePosterInput = z.infer<typeof generatePosterSchema>;

export interface GeneratePosterResponse {
  poster: {
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
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface QuotaExceededResponse {
  message: string;
  code: 'QUOTA_EXCEEDED';
  usage: {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
  };
}
```

**Step 2: Run type-check**

```bash
cd apps/api && pnpm type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/handlers/posters/types.ts
git commit -m "feat(api): add generate poster handler types and schemas"
```

---

## Task 10: Implement Generate Poster Handler

**Files:**
- Modify: `apps/api/src/handlers/posters/generate-poster.ts`

**Step 1: Implement the handler**

Replace `apps/api/src/handlers/posters/generate-poster.ts`:

```typescript
/**
 * Generate Poster Handler
 *
 * POST /api/posters/generate
 *
 * Accepts multipart form data with photo upload, generates poster,
 * stores in S3, saves metadata to DynamoDB.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { composePoster } from '@bjj-poster/core';
import { db } from '@bjj-poster/db';
import { parseMultipart, parseMultipartBase64 } from '../../lib/multipart.js';
import { uploadMultipleToS3, generatePosterKeys } from '../../lib/s3.js';
import { generatePosterSchema } from './types.js';
import type { GeneratePosterResponse, QuotaExceededResponse } from './types.js';

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 560;

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(
  statusCode: number,
  message: string,
  code: string
): APIGatewayProxyResult {
  return createResponse(statusCode, { message, code });
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  console.log('Generate poster handler invoked', { requestId });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // 1. Extract userId from JWT
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  if (!userId) {
    return createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED');
  }

  // 2. Check quota BEFORE parsing multipart (fail fast)
  const usageCheck = await db.users.getUsage(userId);
  if (!usageCheck.allowed) {
    const response: QuotaExceededResponse = {
      message: 'Monthly poster limit reached',
      code: 'QUOTA_EXCEEDED',
      usage: {
        used: usageCheck.used,
        limit: usageCheck.limit,
        remaining: 0,
        resetsAt: usageCheck.resetsAt,
      },
    };
    return createResponse(403, response);
  }

  // 3. Parse multipart form data
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required', 'MISSING_BODY');
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return createErrorResponse(400, 'Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE');
  }

  let parsed;
  try {
    parsed = event.isBase64Encoded
      ? await parseMultipartBase64(event.body, contentType)
      : await parseMultipart(event.body, contentType);
  } catch (error) {
    console.error('Multipart parsing error', { requestId, error });
    if (error instanceof Error && error.message.includes('exceeds maximum size')) {
      return createErrorResponse(413, 'Photo exceeds 10MB limit', 'PHOTO_TOO_LARGE');
    }
    return createErrorResponse(400, 'Invalid multipart form data', 'INVALID_MULTIPART');
  }

  // 4. Validate photo
  if (!parsed.file) {
    return createErrorResponse(400, 'Photo is required', 'MISSING_PHOTO');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMimeTypes.includes(parsed.file.mimeType)) {
    return createErrorResponse(400, 'Photo must be JPEG or PNG', 'INVALID_PHOTO');
  }

  // 5. Validate fields with Zod
  const validation = generatePosterSchema.safeParse(parsed.fields);
  if (!validation.success) {
    return createResponse(400, {
      message: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: validation.error.issues,
    });
  }

  const input = validation.data;

  try {
    // 6. Generate poster using composePoster
    console.log('Composing poster', { requestId, templateId: input.templateId });
    const posterResult = await composePoster({
      templateId: input.templateId,
      athletePhoto: parsed.file.buffer,
      data: {
        athleteName: input.athleteName,
        teamName: input.teamName || '',
        achievement: input.achievement || '',
        tournamentName: input.tournamentName,
        date: input.tournamentDate,
        location: input.tournamentLocation || '',
      },
    });

    // 7. Generate thumbnail
    console.log('Generating thumbnail', { requestId });
    const thumbnail = await sharp(posterResult.buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 8. Upload to S3 in parallel
    const posterId = `pstr_${nanoid(12)}`;
    const keys = generatePosterKeys(userId, posterId);

    console.log('Uploading to S3', { requestId, posterId });
    const [posterUpload, thumbnailUpload] = await uploadMultipleToS3([
      { key: keys.imageKey, buffer: posterResult.buffer, contentType: 'image/jpeg' },
      { key: keys.thumbnailKey, buffer: thumbnail, contentType: 'image/jpeg' },
      { key: keys.uploadKey, buffer: parsed.file.buffer, contentType: parsed.file.mimeType },
    ]);

    // 9. Save to DynamoDB
    console.log('Saving to DynamoDB', { requestId, posterId });
    const poster = await db.posters.create({
      userId,
      templateId: input.templateId,
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank,
      tournamentName: input.tournamentName,
      tournamentDate: input.tournamentDate,
      tournamentLocation: input.tournamentLocation,
      achievement: input.achievement,
      imageKey: keys.imageKey,
      thumbnailKey: keys.thumbnailKey,
      uploadKey: keys.uploadKey,
    });

    // 10. Increment usage (after successful save)
    const finalUsage = await db.users.checkAndIncrementUsage(userId);

    // 11. Return success response
    const response: GeneratePosterResponse = {
      poster: {
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
        imageUrl: posterUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        createdAt: poster.createdAt,
      },
      usage: {
        used: finalUsage.used,
        limit: finalUsage.limit,
        remaining: finalUsage.remaining,
      },
    };

    console.log('Poster generated successfully', { requestId, posterId });
    return createResponse(201, response);
  } catch (error) {
    console.error('Poster generation failed', { requestId, error });
    return createErrorResponse(500, 'Failed to generate poster', 'GENERATION_FAILED');
  }
};
```

**Step 2: Install sharp and nanoid if not present**

```bash
cd apps/api && pnpm add sharp nanoid
```

**Step 3: Run type-check**

```bash
cd apps/api && pnpm type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/handlers/posters/generate-poster.ts apps/api/package.json
git commit -m "feat(api): implement generate poster handler"
```

---

## Task 11: Write Handler Unit Tests

**Files:**
- Create: `apps/api/src/handlers/posters/__tests__/generate-poster.test.ts`

**Step 1: Write comprehensive tests**

Create `apps/api/src/handlers/posters/__tests__/generate-poster.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock dependencies
vi.mock('@bjj-poster/core', () => ({
  composePoster: vi.fn().mockResolvedValue({
    buffer: Buffer.from('fake-poster-data'),
    metadata: { width: 1080, height: 1512, format: 'jpeg', size: 100000 },
  }),
}));

vi.mock('@bjj-poster/db', () => ({
  db: {
    users: {
      getUsage: vi.fn().mockResolvedValue({
        allowed: true,
        used: 0,
        limit: 2,
        remaining: 2,
        resetsAt: '2026-02-01T00:00:00.000Z',
      }),
      checkAndIncrementUsage: vi.fn().mockResolvedValue({
        allowed: true,
        used: 1,
        limit: 2,
        remaining: 1,
        resetsAt: '2026-02-01T00:00:00.000Z',
      }),
    },
    posters: {
      create: vi.fn().mockResolvedValue({
        posterId: 'pstr_test123',
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'World Championship',
        tournamentDate: 'June 2025',
        status: 'completed',
        imageKey: 'posters/user-123/pstr_test123/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_test123/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_test123/photo.jpg',
        createdAt: '2026-01-16T00:00:00.000Z',
        updatedAt: '2026-01-16T00:00:00.000Z',
      }),
    },
  },
}));

vi.mock('../../../lib/multipart.js', () => ({
  parseMultipart: vi.fn().mockResolvedValue({
    fields: {
      templateId: 'classic',
      athleteName: 'João Silva',
      beltRank: 'blue',
      tournamentName: 'World Championship',
      tournamentDate: 'June 2025',
    },
    file: {
      fieldname: 'photo',
      filename: 'test.jpg',
      encoding: '7bit',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    },
  }),
  parseMultipartBase64: vi.fn(),
}));

vi.mock('../../../lib/s3.js', () => ({
  uploadMultipleToS3: vi.fn().mockResolvedValue([
    { key: 'posters/user-123/pstr_test123/original.jpg', url: 'https://cdn.example.com/poster.jpg' },
    { key: 'posters/user-123/pstr_test123/thumbnail.jpg', url: 'https://cdn.example.com/thumb.jpg' },
    { key: 'uploads/user-123/pstr_test123/photo.jpg', url: 'https://cdn.example.com/photo.jpg' },
  ]),
  generatePosterKeys: vi.fn().mockReturnValue({
    imageKey: 'posters/user-123/pstr_test123/original.jpg',
    thumbnailKey: 'posters/user-123/pstr_test123/thumbnail.jpg',
    uploadKey: 'uploads/user-123/pstr_test123/photo.jpg',
  }),
}));

vi.mock('sharp', () => ({
  default: vi.fn().mockReturnValue({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-thumbnail')),
  }),
}));

import { handler } from '../generate-poster.js';
import { db } from '@bjj-poster/db';

const mockGetUsage = vi.mocked(db.users.getUsage);

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    path: '/api/posters/generate',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'content-type': 'multipart/form-data; boundary=----test' },
    body: 'fake-multipart-body',
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-123',
      authorizer: {
        claims: { sub: 'user-123', email: 'test@example.com' },
      },
    } as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext: Context = {
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:test',
  memoryLimitInMB: '2048',
  awsRequestId: 'test-123',
  logGroupName: 'test',
  logStreamName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('generatePoster handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with poster on success', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.poster).toBeDefined();
    expect(body.poster.athleteName).toBe('João Silva');
    expect(body.usage.used).toBe(1);
  });

  it('returns 401 when not authenticated', async () => {
    const event = createEvent({
      requestContext: {
        requestId: 'test-123',
        authorizer: null,
      } as any,
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when quota exceeded', async () => {
    mockGetUsage.mockResolvedValueOnce({
      allowed: false,
      used: 2,
      limit: 2,
      remaining: 0,
      resetsAt: '2026-02-01T00:00:00.000Z',
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('QUOTA_EXCEEDED');
    expect(body.usage.used).toBe(2);
    expect(body.usage.resetsAt).toBeDefined();
  });

  it('returns 400 when body is missing', async () => {
    const event = createEvent({ body: null });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('MISSING_BODY');
  });

  it('returns 400 when content-type is wrong', async () => {
    const event = createEvent({
      headers: { 'content-type': 'application/json' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('INVALID_CONTENT_TYPE');
  });

  it('handles OPTIONS preflight', async () => {
    const event = createEvent({ httpMethod: 'OPTIONS' });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(204);
    expect(result.headers?.['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('includes CORS headers in response', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
```

**Step 2: Run tests**

```bash
cd apps/api && pnpm test -- generate-poster.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/handlers/posters/__tests__/generate-poster.test.ts
git commit -m "test(api): add generate poster handler unit tests"
```

---

## Task 12: Register Route in Local Server

**Files:**
- Modify: `apps/api/src/local-server.ts`

**Step 1: Check current routes and add multipart support**

The local server needs to handle multipart form data. Add raw body parsing for the generate endpoint.

Find the route registration section and ensure the generate poster route is registered with proper middleware.

Add before the JSON middleware:
```typescript
// Raw body for multipart form data (generate poster)
app.use('/api/posters/generate', express.raw({ type: 'multipart/form-data', limit: '15mb' }));
```

Ensure the route is registered:
```typescript
app.post('/api/posters/generate', lambdaHandler(generatePosterHandler));
```

**Step 2: Run local server to verify**

```bash
cd apps/api && pnpm dev
```

Test with curl (expect 401 since no auth):
```bash
curl -X POST http://localhost:3001/api/posters/generate
```

Expected: 401 Unauthorized (confirms route is registered)

**Step 3: Commit**

```bash
git add apps/api/src/local-server.ts
git commit -m "feat(api): register generate poster route in local server"
```

---

## Task 13: Run Full Test Suite

**Step 1: Run all API tests**

```bash
cd apps/api && pnpm test
```

Expected: All tests pass

**Step 2: Run all DB tests**

```bash
cd packages/db && pnpm test
```

Expected: All tests pass

**Step 3: Run type-check across monorepo**

```bash
pnpm type-check
```

Expected: PASS (ignore unrelated test file error)

---

## Task 14: Final Commit and Summary

**Step 1: Create summary commit if any uncommitted changes**

```bash
git status
# If clean, skip. Otherwise:
git add -A
git commit -m "chore: cleanup and final touches for ODE-194"
```

**Step 2: Verify all commits**

```bash
git log --oneline -10
```

Should show commits for each task.

---

## Summary

This plan implements the Generate Poster API Handler with:

1. **Poster Entity** - DynamoDB data model
2. **Poster Repository** - CRUD operations with create/query
3. **Usage Tracking** - Monthly quota with auto-reset
4. **Multipart Parser** - busboy-based form data parsing
5. **S3 Helper** - Upload utilities with parallel support
6. **Handler** - Full implementation with TDD
7. **Tests** - Unit tests for all components

Total estimated tasks: 14
Dependencies: `busboy`, `@types/busboy`, `@aws-sdk/client-s3`, `sharp`, `nanoid`
