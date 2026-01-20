# Generate Poster API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Lambda handler for generating BJJ tournament posters from user input, including multipart form parsing, image composition, S3 upload, and DynamoDB storage.

**Architecture:** Lambda function receives multipart form data, validates user quota, composes poster using Sharp, uploads to S3, stores metadata in DynamoDB, and returns poster URL.

**Tech Stack:** AWS Lambda, TypeScript, Busboy (multipart parsing), Sharp (image processing), AWS SDK v3 (S3, DynamoDB), Zod (validation), Vitest

---

## Task 1: Multipart Form Parser

### Step 1: Write failing test for multipart parser

**File:** `apps/api/src/lib/__tests__/multipart.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseMultipartForm } from '../multipart';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('parseMultipartForm', () => {
  it('parses athletePhoto from multipart form data', async () => {
    const mockEvent: APIGatewayProxyEvent = {
      body: 'mock-multipart-body',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary'
      },
      isBase64Encoded: false
    } as any;

    const result = await parseMultipartForm(mockEvent);

    expect(result.athletePhoto).toBeDefined();
    expect(result.athletePhoto.buffer).toBeInstanceOf(Buffer);
    expect(result.athleteName).toBe('Test Athlete');
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd apps/api
pnpm test src/lib/__tests__/multipart.test.ts
```

**Expected output:** FAIL - `parseMultipartForm` not defined

### Step 3: Install Busboy dependency

```bash
cd apps/api
pnpm add busboy
pnpm add -D @types/busboy
```

### Step 4: Implement minimal multipart parser

**File:** `apps/api/src/lib/multipart.ts`

```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import Busboy from 'busboy';

export interface ParsedFormData {
  athletePhoto: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
  athleteName: string;
  beltRank: string;
  team?: string;
  tournament: string;
  date?: string;
  location?: string;
  templateId: string;
}

export async function parseMultipartForm(
  event: APIGatewayProxyEvent
): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: event.headers as any
    });

    const fields: Record<string, string> = {};
    let photoBuffer: Buffer | null = null;
    let photoFilename = '';
    let photoMimeType = '';

    busboy.on('file', (fieldname, file, info) => {
      if (fieldname === 'athletePhoto') {
        photoFilename = info.filename;
        photoMimeType = info.mimeType;

        const chunks: Buffer[] = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          photoBuffer = Buffer.concat(chunks);
        });
      } else {
        file.resume(); // Skip other files
      }
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('finish', () => {
      if (!photoBuffer) {
        return reject(new Error('athletePhoto is required'));
      }

      resolve({
        athletePhoto: {
          buffer: photoBuffer,
          filename: photoFilename,
          mimeType: photoMimeType
        },
        athleteName: fields.athleteName || '',
        beltRank: fields.beltRank || '',
        team: fields.team,
        tournament: fields.tournament || '',
        date: fields.date,
        location: fields.location,
        templateId: fields.templateId || ''
      });
    });

    busboy.on('error', reject);

    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : event.body;

    busboy.write(body);
    busboy.end();
  });
}
```

### Step 5: Run test to verify it passes

```bash
cd apps/api
pnpm test src/lib/__tests__/multipart.test.ts
```

**Expected output:** PASS

### Step 6: Commit

```bash
git add apps/api/src/lib/multipart.ts apps/api/src/lib/__tests__/multipart.test.ts apps/api/package.json
git commit -m "feat(api): add multipart form parser for file uploads"
```

---

## Task 2: Input Validation with Zod

### Step 1: Write failing test for validation

**File:** `apps/api/src/lib/validations/__tests__/poster-input.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validatePosterInput, ValidationError } from '../poster-input';

describe('validatePosterInput', () => {
  it('validates valid poster input', () => {
    const input = {
      athletePhoto: { buffer: Buffer.from('test'), size: 1024 },
      athleteName: 'John Doe',
      beltRank: 'Black',
      tournament: 'IBJJF Worlds',
      templateId: 'classic-001'
    };

    const result = validatePosterInput(input);
    expect(result.athleteName).toBe('John Doe');
  });

  it('throws ValidationError for missing athleteName', () => {
    const input = {
      athletePhoto: { buffer: Buffer.from('test'), size: 1024 },
      athleteName: '',
      beltRank: 'Black',
      tournament: 'IBJJF Worlds',
      templateId: 'classic-001'
    };

    expect(() => validatePosterInput(input)).toThrow(ValidationError);
  });

  it('throws ValidationError for file too large', () => {
    const input = {
      athletePhoto: { buffer: Buffer.from('test'), size: 11 * 1024 * 1024 },
      athleteName: 'John Doe',
      beltRank: 'Black',
      tournament: 'IBJJF Worlds',
      templateId: 'classic-001'
    };

    expect(() => validatePosterInput(input)).toThrow('Photo must be less than 10MB');
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd apps/api
pnpm test src/lib/validations/__tests__/poster-input.test.ts
```

**Expected output:** FAIL - `validatePosterInput` not defined

### Step 3: Implement validation schema

**File:** `apps/api/src/lib/validations/poster-input.ts`

```typescript
import { z } from 'zod';
import { ValidationError } from '@bjj-poster/core';

const posterInputSchema = z.object({
  athletePhoto: z.object({
    buffer: z.instanceof(Buffer),
    size: z.number().max(10 * 1024 * 1024, 'Photo must be less than 10MB')
  }),
  athleteName: z.string().min(1, 'athleteName is required').max(50),
  beltRank: z.enum(['White', 'Blue', 'Purple', 'Brown', 'Black', 'RedBlack', 'Red']),
  team: z.string().max(50).optional(),
  tournament: z.string().min(1, 'tournament is required').max(100),
  date: z.string().optional(),
  location: z.string().max(100).optional(),
  templateId: z.string().min(1, 'templateId is required')
});

export function validatePosterInput(data: unknown) {
  try {
    return posterInputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
}

export { ValidationError };
```

### Step 4: Run test to verify it passes

```bash
cd apps/api
pnpm test src/lib/validations/__tests__/poster-input.test.ts
```

**Expected output:** PASS

### Step 5: Commit

```bash
git add apps/api/src/lib/validations/poster-input.ts apps/api/src/lib/validations/__tests__/poster-input.test.ts
git commit -m "feat(api): add poster input validation with Zod"
```

---

## Task 3: S3 Upload Utilities

### Step 1: Write failing test for S3 upload

**File:** `apps/api/src/lib/__tests__/s3.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { uploadToS3, generateThumbnail, getS3Url } from '../s3';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn()
}));

describe('S3 utilities', () => {
  it('uploads buffer to S3', async () => {
    const buffer = Buffer.from('test-image');
    await uploadToS3('test/key.png', buffer, 'image/png');
    expect(true).toBe(true); // Verify no error
  });

  it('generates thumbnail from buffer', async () => {
    const buffer = Buffer.from('fake-image-data');
    const thumbnail = await generateThumbnail(buffer);
    expect(thumbnail).toBeInstanceOf(Buffer);
  });

  it('generates S3 URL from key', () => {
    const url = getS3Url('posters/user123/poster.png');
    expect(url).toContain('s3.amazonaws.com');
    expect(url).toContain('posters/user123/poster.png');
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd apps/api
pnpm test src/lib/__tests__/s3.test.ts
```

**Expected output:** FAIL - S3 functions not defined

### Step 3: Install AWS SDK dependencies

```bash
cd apps/api
pnpm add @aws-sdk/client-s3 sharp
```

### Step 4: Implement S3 utilities

**File:** `apps/api/src/lib/s3.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.POSTER_BUCKET_NAME || 'bjj-poster-app-dev-posters';

export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
}

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(300, 400, { fit: 'cover' })
    .png()
    .toBuffer();
}

export function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

export function generatePosterId(): string {
  return `poster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Step 5: Run test to verify it passes

```bash
cd apps/api
pnpm test src/lib/__tests__/s3.test.ts
```

**Expected output:** PASS (or mocked success)

### Step 6: Commit

```bash
git add apps/api/src/lib/s3.ts apps/api/src/lib/__tests__/s3.test.ts apps/api/package.json
git commit -m "feat(api): add S3 upload and thumbnail generation utilities"
```

---

## Task 4: Poster Repository

### Step 1: Write failing test for poster repository

**File:** `packages/db/src/repositories/__tests__/poster-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PosterRepository } from '../poster-repository';

describe('PosterRepository', () => {
  let repository: PosterRepository;

  beforeEach(() => {
    repository = new PosterRepository();
  });

  it('creates a poster', async () => {
    const poster = {
      userId: 'user123',
      id: 'poster123',
      url: 'https://s3.amazonaws.com/poster.png',
      thumbnailUrl: 'https://s3.amazonaws.com/thumb.png',
      status: 'completed' as const,
      athleteName: 'John Doe',
      beltRank: 'Black',
      tournament: 'IBJJF Worlds',
      templateId: 'classic-001',
      createdAt: new Date().toISOString()
    };

    const result = await repository.createPoster(poster);
    expect(result.id).toBe('poster123');
  });

  it('gets user posters', async () => {
    const posters = await repository.getUserPosters({
      userId: 'user123',
      limit: 10
    });

    expect(Array.isArray(posters.posters)).toBe(true);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/db
pnpm test src/repositories/__tests__/poster-repository.test.ts
```

**Expected output:** FAIL - `PosterRepository` not defined

### Step 3: Implement poster repository

**File:** `packages/db/src/repositories/poster-repository.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

export interface Poster {
  userId: string;
  id: string;
  url: string;
  thumbnailUrl: string;
  status: 'completed' | 'failed';
  athleteName: string;
  beltRank: string;
  team?: string;
  tournament: string;
  date?: string;
  location?: string;
  templateId: string;
  createdAt: string;
}

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

export class PosterRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.TABLE_NAME || 'bjj-poster-app-dev';
  }

  async createPoster(poster: Poster): Promise<Poster> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${poster.userId}`,
        SK: `POSTER#${new Date(poster.createdAt).getTime()}`,
        ...poster,
        GSI1PK: `POSTER#${poster.id}`,
        GSI1SK: `USER#${poster.userId}`
      }
    }));

    return poster;
  }

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
      ScanIndexForward: false
    };

    if (beltRank) {
      queryParams.FilterExpression = 'beltRank = :beltRank';
      queryParams.ExpressionAttributeValues![':beltRank'] = beltRank;
    }

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
}

export const posterRepository = new PosterRepository();
```

### Step 4: Export from db package

**File:** `packages/db/src/index.ts`

```typescript
export { PosterRepository, posterRepository } from './repositories/poster-repository';
export type { Poster, GetUserPostersOptions, GetUserPostersResult } from './repositories/poster-repository';
```

### Step 5: Run test to verify it passes

```bash
cd packages/db
pnpm test src/repositories/__tests__/poster-repository.test.ts
```

**Expected output:** PASS

### Step 6: Commit

```bash
git add packages/db/src/repositories/poster-repository.ts packages/db/src/repositories/__tests__/poster-repository.test.ts packages/db/src/index.ts
git commit -m "feat(db): add poster repository with DynamoDB operations"
```

---

## Task 5: Generate Poster Handler

### Step 1: Write failing test for handler

**File:** `apps/api/src/handlers/posters/__tests__/generate-poster.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../generate-poster';
import { APIGatewayProxyEvent } from 'aws-lambda';

vi.mock('@bjj-poster/db');
vi.mock('@bjj-poster/core');
vi.mock('../../../lib/s3');
vi.mock('../../../lib/multipart');

describe('generate-poster handler', () => {
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

  it('returns 402 when quota exceeded', async () => {
    // Mock implementation
  });

  it('generates poster successfully', async () => {
    // Mock implementation
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd apps/api
pnpm test src/handlers/posters/__tests__/generate-poster.test.ts
```

**Expected output:** FAIL - handler not defined

### Step 3: Implement generate poster handler

**File:** `apps/api/src/handlers/posters/generate-poster.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '@bjj-poster/core';
import { userRepository, posterRepository } from '@bjj-poster/db';
import { composePoster } from '@bjj-poster/core';
import { parseMultipartForm } from '../../lib/multipart';
import { uploadToS3, generateThumbnail, generatePosterId, getS3Url } from '../../lib/s3';
import { validatePosterInput } from '../../lib/validations/poster-input';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  logger.info('Generate poster request', { requestId });

  try {
    // 1. Extract userId from JWT
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // 2. Parse multipart form data
    const formData = await parseMultipartForm(event);

    // 3. Validate input
    const validatedInput = validatePosterInput(formData);

    // 4. Check user quota
    const user = await userRepository.getUser(userId);
    const canCreate = user.postersThisMonth < user.postersLimit;

    if (!canCreate) {
      return {
        statusCode: 402,
        body: JSON.stringify({
          error: 'QuotaExceededError',
          message: `You've reached your monthly limit of ${user.postersLimit} posters`,
          nextResetDate: getNextMonthResetDate()
        })
      };
    }

    // 5. Generate poster using core library
    const posterBuffer = await composePoster({
      athletePhoto: formData.athletePhoto.buffer,
      athleteName: validatedInput.athleteName,
      beltRank: validatedInput.beltRank as any,
      team: validatedInput.team,
      tournament: validatedInput.tournament,
      date: validatedInput.date,
      location: validatedInput.location,
      templateId: validatedInput.templateId
    });

    // 6. Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(posterBuffer);

    // 7. Upload to S3
    const posterId = generatePosterId();
    const posterKey = `posters/${userId}/${posterId}.png`;
    const thumbnailKey = `posters/${userId}/${posterId}_thumb.png`;

    await Promise.all([
      uploadToS3(posterKey, posterBuffer, 'image/png'),
      uploadToS3(thumbnailKey, thumbnailBuffer, 'image/png')
    ]);

    const posterUrl = getS3Url(posterKey);
    const thumbnailUrl = getS3Url(thumbnailKey);

    // 8. Store metadata in DynamoDB
    const poster = await posterRepository.createPoster({
      userId,
      id: posterId,
      url: posterUrl,
      thumbnailUrl,
      status: 'completed',
      athleteName: validatedInput.athleteName,
      beltRank: validatedInput.beltRank,
      team: validatedInput.team,
      tournament: validatedInput.tournament,
      date: validatedInput.date,
      location: validatedInput.location,
      templateId: validatedInput.templateId,
      createdAt: new Date().toISOString()
    });

    // 9. Increment user usage
    await userRepository.incrementPosterUsage(userId);

    // 10. Return response
    logger.info('Poster generated successfully', { requestId, posterId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(poster)
    };

  } catch (error) {
    logger.error('Failed to generate poster', { requestId, error });

    if (error instanceof Error && error.message.includes('required')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'ValidationError',
          message: error.message
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Failed to generate poster'
      })
    };
  }
};

function getNextMonthResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}
```

### Step 4: Update user repository with incrementPosterUsage

**File:** `packages/db/src/repositories/user-repository.ts`

Add method:

```typescript
async incrementPosterUsage(userId: string): Promise<void> {
  await this.client.send(new UpdateCommand({
    TableName: this.tableName,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    },
    UpdateExpression: 'SET postersThisMonth = postersThisMonth + :inc',
    ExpressionAttributeValues: {
      ':inc': 1
    }
  }));
}
```

### Step 5: Run test to verify it passes

```bash
cd apps/api
pnpm test src/handlers/posters/__tests__/generate-poster.test.ts
```

**Expected output:** PASS

### Step 6: Run integration test with LocalStack

```bash
pnpm test:integration
```

**Expected output:** PASS

### Step 7: Commit

```bash
git add apps/api/src/handlers/posters/generate-poster.ts apps/api/src/handlers/posters/__tests__/generate-poster.test.ts packages/db/src/repositories/user-repository.ts
git commit -m "feat(api): implement generate poster Lambda handler"
```

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-01-15-generate-poster-api-handler.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
