# Get Templates API Handler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Lambda handler for fetching available poster templates with category filtering

**Architecture:** Simple read-only Lambda handler that queries DynamoDB using GSI for category filtering

**Tech Stack:** AWS Lambda, TypeScript, DynamoDB, Vitest

---

## Task 1: Template Repository

### Step 1: Write failing test

**File:** `packages/db/src/repositories/__tests__/template-repository.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { TemplateRepository } from '../template-repository';

describe('TemplateRepository', () => {
  let repository: TemplateRepository;

  beforeEach(() => {
    repository = new TemplateRepository();
  });

  it('gets all templates', async () => {
    const templates = await repository.getTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  it('filters templates by category', async () => {
    const templates = await repository.getTemplates('modern');
    templates.forEach(t => expect(t.category).toBe('modern'));
  });
});
```

### Step 2: Run test (expect FAIL)

```bash
cd packages/db
pnpm test src/repositories/__tests__/template-repository.test.ts
```

### Step 3: Implement repository

**File:** `packages/db/src/repositories/template-repository.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface Template {
  id: string;
  name: string;
  category: 'traditional' | 'modern' | 'minimalist' | 'bold';
  thumbnailUrl: string;
  description: string;
  popular: boolean;
  tags: string[];
}

export class TemplateRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    this.tableName = process.env.TABLE_NAME || 'bjj-poster-app-dev';
  }

  async getTemplates(category?: string): Promise<Template[]> {
    if (category) {
      const result = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `TEMPLATE_CATEGORY#${category}`
        }
      }));
      return (result.Items || []) as Template[];
    }

    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'TEMPLATE' }
    }));
    return (result.Items || []) as Template[];
  }
}

export const templateRepository = new TemplateRepository();
```

### Step 4: Run test (expect PASS)

```bash
cd packages/db
pnpm test src/repositories/__tests__/template-repository.test.ts
```

### Step 5: Commit

```bash
git add packages/db/src/repositories/template-repository.ts packages/db/src/repositories/__tests__/template-repository.test.ts
git commit -m "feat(db): add template repository with category filtering"
```

---

## Task 2: Get Templates Handler

### Step 1: Write failing test

**File:** `apps/api/src/handlers/templates/__tests__/get-templates.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handler } from '../get-templates';

vi.mock('@bjj-poster/db');

describe('get-templates handler', () => {
  it('returns all templates', async () => {
    const event = { queryStringParameters: null } as any;
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.templates).toBeDefined();
  });

  it('filters by category', async () => {
    const event = { queryStringParameters: { category: 'modern' } } as any;
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});
```

### Step 2: Run test (expect FAIL)

```bash
cd apps/api
pnpm test src/handlers/templates/__tests__/get-templates.test.ts
```

### Step 3: Implement handler

**File:** `apps/api/src/handlers/templates/get-templates.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '@bjj-poster/core';
import { templateRepository } from '@bjj-poster/db';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  logger.info('Get templates request', { requestId });

  try {
    const category = event.queryStringParameters?.category;
    const templates = await templateRepository.getTemplates(category);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify({ templates })
    };
  } catch (error) {
    logger.error('Failed to fetch templates', { requestId, error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Failed to fetch templates'
      })
    };
  }
};
```

### Step 4: Run test (expect PASS)

```bash
cd apps/api
pnpm test src/handlers/templates/__tests__/get-templates.test.ts
```

### Step 5: Commit

```bash
git add apps/api/src/handlers/templates/get-templates.ts apps/api/src/handlers/templates/__tests__/get-templates.test.ts
git commit -m "feat(api): implement get templates Lambda handler"
```

---

## Execution Handoff

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - Dispatch subagent per task, review between tasks

**2. Parallel Session (separate)** - Open new session with executing-plans for batch execution

**Which approach?**
