# Get Templates API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Get Templates API handler with sorting, caching, tests, and seeding script.

**Architecture:** The handler fetches templates from DynamoDB via the repository, sorts by category, and returns with cache headers. TDD approach: write tests first, then implementation.

**Tech Stack:** TypeScript, Vitest, DynamoDB, LocalStack

---

## Task 1: Create Unit Test File with Happy Path Test

**Files:**
- Create: `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock db before importing handler
vi.mock('@bjj-poster/db', () => ({
  db: {
    templates: {
      list: vi.fn(),
    },
  },
}));

import { handler } from '../list-templates.js';
import { db } from '@bjj-poster/db';

const mockTemplates = [
  {
    templateId: 'tpl-1',
    name: 'Tournament Classic',
    description: 'Classic tournament poster',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.example.com/tpl-1.jpg',
    isPremium: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    templateId: 'tpl-2',
    name: 'Gym Promo',
    description: 'Gym promotional poster',
    category: 'gym',
    thumbnailUrl: 'https://cdn.example.com/tpl-2.jpg',
    isPremium: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/templates',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-id',
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext = {} as Context;

describe('listTemplates handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all templates with correct structure', async () => {
    vi.mocked(db.templates.list).mockResolvedValue(mockTemplates);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result).toBeDefined();
    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.templates).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.templates[0]).toHaveProperty('templateId');
    expect(body.templates[0]).toHaveProperty('name');
    expect(body.templates[0]).toHaveProperty('category');
    expect(body.templates[0]).toHaveProperty('thumbnailUrl');
  });
});
```

**Step 2: Run test to verify it passes (existing handler)**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: PASS (handler already exists)

**Step 3: Commit**

```bash
git add apps/api/src/handlers/templates/__tests__/list-templates.test.ts
git commit -m "test(api): add list-templates handler happy path test"
```

---

## Task 2: Add Category Filter Tests

**Files:**
- Modify: `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`

**Step 1: Add category filter test**

Add to the describe block:

```typescript
  it('filters templates by category when provided', async () => {
    const tournamentTemplates = mockTemplates.filter(t => t.category === 'tournament');
    vi.mocked(db.templates.list).mockResolvedValue(tournamentTemplates);

    const event = createEvent({
      queryStringParameters: { category: 'tournament' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);
    expect(db.templates.list).toHaveBeenCalledWith('tournament');

    const body = JSON.parse(result!.body);
    expect(body.templates).toHaveLength(1);
    expect(body.templates[0].category).toBe('tournament');
  });

  it('returns 400 for invalid category', async () => {
    const event = createEvent({
      queryStringParameters: { category: 'invalid-category' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(400);

    const body = JSON.parse(result!.body);
    expect(body.message).toContain('Invalid category');
    expect(db.templates.list).not.toHaveBeenCalled();
  });
```

**Step 2: Run tests**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/handlers/templates/__tests__/list-templates.test.ts
git commit -m "test(api): add category filter tests for list-templates"
```

---

## Task 3: Add Sorting Test and Implementation

**Files:**
- Modify: `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`
- Modify: `apps/api/src/handlers/templates/list-templates.ts`

**Step 1: Write the failing sort test**

Add to the describe block:

```typescript
  it('returns templates sorted by category alphabetically', async () => {
    // Return in reverse order to verify sorting
    const unsortedTemplates = [
      { ...mockTemplates[0], category: 'tournament' as const },
      { ...mockTemplates[1], category: 'gym' as const },
    ];
    vi.mocked(db.templates.list).mockResolvedValue(unsortedTemplates);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    // 'gym' comes before 'tournament' alphabetically
    expect(body.templates[0].category).toBe('gym');
    expect(body.templates[1].category).toBe('tournament');
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: FAIL (no sorting implemented)

**Step 3: Implement sorting in handler**

In `apps/api/src/handlers/templates/list-templates.ts`, after line 66 (`const templates = await db.templates.list(category);`), add:

```typescript
    // Sort by category alphabetically
    templates.sort((a, b) => a.category.localeCompare(b.category));
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/handlers/templates/__tests__/list-templates.test.ts apps/api/src/handlers/templates/list-templates.ts
git commit -m "feat(api): add category sorting to list-templates handler"
```

---

## Task 4: Add Cache Header Test and Implementation

**Files:**
- Modify: `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`
- Modify: `apps/api/src/handlers/templates/list-templates.ts`

**Step 1: Write the failing cache header test**

Add to the describe block:

```typescript
  it('includes Cache-Control header for 5-minute caching', async () => {
    vi.mocked(db.templates.list).mockResolvedValue(mockTemplates);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);
    expect(result!.headers).toBeDefined();
    expect(result!.headers!['Cache-Control']).toBe('public, max-age=300');
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: FAIL (no Cache-Control header)

**Step 3: Add cache header to createResponse function**

In `apps/api/src/handlers/templates/list-templates.ts`, modify the `createResponse` function (around line 29-40):

```typescript
function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
    body: JSON.stringify(body),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/handlers/templates/__tests__/list-templates.test.ts apps/api/src/handlers/templates/list-templates.ts
git commit -m "feat(api): add cache headers to list-templates handler"
```

---

## Task 5: Add Empty Results and Error Handling Tests

**Files:**
- Modify: `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`

**Step 1: Add remaining tests**

Add to the describe block:

```typescript
  it('returns empty array when no templates match', async () => {
    vi.mocked(db.templates.list).mockResolvedValue([]);

    const event = createEvent({
      queryStringParameters: { category: 'social' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.templates).toEqual([]);
    expect(body.count).toBe(0);
  });

  it('returns 500 when database fails', async () => {
    vi.mocked(db.templates.list).mockRejectedValue(new Error('Database connection failed'));

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(500);

    const body = JSON.parse(result!.body);
    expect(body.message).toBe('Failed to retrieve templates');
  });
```

**Step 2: Run tests**

Run: `cd apps/api && pnpm test src/handlers/templates/__tests__/list-templates.test.ts`

Expected: PASS (handler already handles these cases)

**Step 3: Commit**

```bash
git add apps/api/src/handlers/templates/__tests__/list-templates.test.ts
git commit -m "test(api): add empty results and error handling tests"
```

---

## Task 6: Create Template Seeding Script

**Files:**
- Create: `packages/db/src/scripts/seed-templates.ts`
- Modify: `packages/db/package.json`

**Step 1: Create the seeding script**

```typescript
/**
 * Seed Templates Script
 *
 * Populates DynamoDB with sample templates for development and testing.
 * Idempotent - checks if templates exist before inserting.
 *
 * Usage:
 *   USE_LOCALSTACK=true pnpm seed:templates
 */

import { dynamoClient } from '../client.js';
import { TemplateRepository } from '../repositories/template-repository.js';
import type { CreateTemplateInput, TemplateCategory } from '../entities/template.js';

const templateRepository = new TemplateRepository(dynamoClient);

const sampleTemplates: CreateTemplateInput[] = [
  // Tournament templates
  {
    name: 'Tournament Classic',
    description: 'Clean, professional design for tournament announcements',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/tournament-classic.jpg',
    isPremium: false,
  },
  {
    name: 'Tournament Bold',
    description: 'High-impact design with bold typography',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/tournament-bold.jpg',
    isPremium: true,
  },
  // Promotion templates
  {
    name: 'Belt Promotion',
    description: 'Celebrate belt promotions with style',
    category: 'promotion',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/belt-promotion.jpg',
    isPremium: false,
  },
  {
    name: 'Stripe Ceremony',
    description: 'Mark stripe achievements',
    category: 'promotion',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/stripe-ceremony.jpg',
    isPremium: false,
  },
  // Gym templates
  {
    name: 'Gym Spotlight',
    description: 'Feature your gym and athletes',
    category: 'gym',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/gym-spotlight.jpg',
    isPremium: false,
  },
  {
    name: 'Academy Premium',
    description: 'Premium design for academy promotions',
    category: 'gym',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/academy-premium.jpg',
    isPremium: true,
  },
  // Social templates
  {
    name: 'Social Share',
    description: 'Optimized for social media sharing',
    category: 'social',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/social-share.jpg',
    isPremium: false,
  },
  {
    name: 'Instagram Story',
    description: 'Vertical format for Instagram stories',
    category: 'social',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/instagram-story.jpg',
    isPremium: true,
  },
];

async function seedTemplates(): Promise<void> {
  console.log('Seeding templates...\n');

  // Check existing templates
  const existingTemplates = await templateRepository.list();
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  let created = 0;
  let skipped = 0;

  for (const template of sampleTemplates) {
    if (existingNames.has(template.name)) {
      console.log(`  SKIP: ${template.name} (already exists)`);
      skipped++;
      continue;
    }

    await templateRepository.create(template);
    console.log(`  CREATE: ${template.name}`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

seedTemplates().catch((error) => {
  console.error('Failed to seed templates:', error);
  process.exit(1);
});
```

**Step 2: Add npm script to package.json**

In `packages/db/package.json`, add to scripts:

```json
"seed:templates": "tsx src/scripts/seed-templates.ts"
```

**Step 3: Run the script (with LocalStack)**

Run: `cd packages/db && USE_LOCALSTACK=true pnpm seed:templates`

Expected: Creates templates or skips if they exist

**Step 4: Commit**

```bash
git add packages/db/src/scripts/seed-templates.ts packages/db/package.json
git commit -m "feat(db): add template seeding script"
```

---

## Task 7: Create Integration Test Setup

**Files:**
- Create: `apps/api/vitest.integration.config.ts`
- Create: `apps/api/src/handlers/templates/__tests__/list-templates.integration.test.ts`

**Step 1: Create integration test config**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    globals: false,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

**Step 2: Create integration test file**

```typescript
/**
 * Integration tests for list-templates handler
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

import { handler } from '../list-templates.js';

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

const testTemplates = [
  {
    PK: 'TEMPLATE',
    SK: 'tournament#tpl-1',
    entityType: 'TEMPLATE',
    templateId: 'tpl-1',
    name: 'Tournament Classic',
    description: 'Classic tournament poster',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.example.com/tpl-1.jpg',
    isPremium: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    PK: 'TEMPLATE',
    SK: 'gym#tpl-2',
    entityType: 'TEMPLATE',
    templateId: 'tpl-2',
    name: 'Gym Spotlight',
    description: 'Gym promotional poster',
    category: 'gym',
    thumbnailUrl: 'https://cdn.example.com/tpl-2.jpg',
    isPremium: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    PK: 'TEMPLATE',
    SK: 'social#tpl-3',
    entityType: 'TEMPLATE',
    templateId: 'tpl-3',
    name: 'Social Share',
    description: 'Social media poster',
    category: 'social',
    thumbnailUrl: 'https://cdn.example.com/tpl-3.jpg',
    isPremium: false,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

function createEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/api/templates',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'integration-test-request',
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext = {} as Context;

describe('listTemplates handler (integration)', () => {
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
      // Table may already exist
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    }

    // Seed test data
    for (const template of testTemplates) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: template,
        })
      );
    }
  });

  afterAll(async () => {
    // Clean up test table
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

  it('retrieves all templates from DynamoDB', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result).toBeDefined();
    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.templates).toHaveLength(3);
    expect(body.count).toBe(3);
  });

  it('filters by category correctly', async () => {
    const event = createEvent({
      queryStringParameters: { category: 'tournament' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.templates).toHaveLength(1);
    expect(body.templates[0].category).toBe('tournament');
  });

  it('returns templates sorted by category', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    const categories = body.templates.map(
      (t: { category: string }) => t.category
    );
    // Should be sorted alphabetically: gym, social, tournament
    expect(categories).toEqual(['gym', 'social', 'tournament']);
  });
});
```

**Step 3: Verify LocalStack is running**

Run: `pnpm localstack:up` (from root)

**Step 4: Run integration tests**

Run: `cd apps/api && USE_LOCALSTACK=true pnpm test:integration`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/vitest.integration.config.ts apps/api/src/handlers/templates/__tests__/list-templates.integration.test.ts
git commit -m "test(api): add list-templates integration tests with LocalStack"
```

---

## Task 8: Final Verification

**Step 1: Run all unit tests**

Run: `cd apps/api && pnpm test`

Expected: All tests PASS

**Step 2: Run type check**

Run: `cd apps/api && pnpm type-check`

Expected: No errors

**Step 3: Run lint**

Run: `cd apps/api && pnpm lint`

Expected: No errors

**Step 4: Test locally with curl**

Run: `cd apps/api && pnpm dev` (in one terminal)

Then: `curl -i http://localhost:3001/api/templates`

Expected:
- Status 200
- `Cache-Control: public, max-age=300` header
- Templates sorted by category

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(api): address any issues found in verification"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Happy path unit test | Create test file |
| 2 | Category filter tests | Add tests |
| 3 | Sorting test + implementation | Test + handler |
| 4 | Cache header test + implementation | Test + handler |
| 5 | Empty/error tests | Add tests |
| 6 | Seeding script | Create script + package.json |
| 7 | Integration tests | Config + test file |
| 8 | Final verification | Run all checks |
