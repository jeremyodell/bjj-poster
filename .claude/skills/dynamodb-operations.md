# Skill: DynamoDB Operations

Use this skill when working with DynamoDB in the BJJ Poster App.

## Single-Table Design Overview

This project uses single-table design. All entities share one table with composite keys:

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| User | `USER#<id>` | `PROFILE` | `EMAIL#<email>` | `USER` |
| Subscription | `USER#<id>` | `SUB#<stripeId>` | `STATUS#<status>` | `<expiresAt>` |
| Poster | `USER#<id>` | `POSTER#<timestamp>` | `STATUS#<status>` | `<createdAt>` |
| Template | `TEMPLATE` | `<category>#<id>` | - | - |

## Entity Type Definition

```typescript
// packages/db/src/entities/poster.ts
import { z } from 'zod';

export const PosterStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type PosterStatus = (typeof PosterStatus)[keyof typeof PosterStatus];

export const PosterSchema = z.object({
  posterId: z.string().uuid(),
  userId: z.string(),
  templateId: z.string(),
  status: z.nativeEnum(PosterStatus),
  athleteName: z.string(),
  teamName: z.string().optional(),
  beltRank: z.string(),
  tournamentName: z.string(),
  tournamentDate: z.string(),
  tournamentLocation: z.string(),
  uploadedImageKey: z.string(),
  generatedImageKey: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Poster = z.infer<typeof PosterSchema>;

// DynamoDB item shape
export interface PosterItem {
  PK: string;           // USER#<userId>
  SK: string;           // POSTER#<createdAt>
  GSI1PK: string;       // STATUS#<status>
  GSI1SK: string;       // <createdAt>
  entityType: 'POSTER';
  posterId: string;
  userId: string;
  templateId: string;
  status: PosterStatus;
  athleteName: string;
  teamName?: string;
  beltRank: string;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation: string;
  uploadedImageKey: string;
  generatedImageKey?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Repository Pattern

```typescript
// packages/db/src/repositories/poster-repository.ts
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { Poster, PosterItem, PosterStatus } from '../entities/poster';
import { TABLE_NAME } from '../config';

export class PosterRepository {
  constructor(private client: DynamoDBDocumentClient) {}

  async create(input: Omit<Poster, 'posterId' | 'createdAt' | 'updatedAt'>): Promise<Poster> {
    const now = new Date().toISOString();
    const posterId = uuid();

    const item: PosterItem = {
      PK: `USER#${input.userId}`,
      SK: `POSTER#${now}`,
      GSI1PK: `STATUS#${input.status}`,
      GSI1SK: now,
      entityType: 'POSTER',
      posterId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return this.itemToEntity(item);
  }

  async getByUserId(userId: string, posterId: string): Promise<Poster | null> {
    // Query by userId since we don't store SK directly
    const result = await this.client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      FilterExpression: 'posterId = :posterId',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'POSTER#',
        ':posterId': posterId,
      },
    }));

    const item = result.Items?.[0] as PosterItem | undefined;
    return item ? this.itemToEntity(item) : null;
  }

  async listByUserId(userId: string, limit = 20): Promise<Poster[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'POSTER#',
      },
      ScanIndexForward: false, // Newest first
      Limit: limit,
    }));

    return (result.Items as PosterItem[]).map(this.itemToEntity);
  }

  async updateStatus(
    userId: string,
    sk: string,
    status: PosterStatus,
    generatedImageKey?: string
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.client.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: sk,
      },
      UpdateExpression: 'SET #status = :status, GSI1PK = :gsi1pk, updatedAt = :now' +
        (generatedImageKey ? ', generatedImageKey = :imageKey' : ''),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':gsi1pk': `STATUS#${status}`,
        ':now': now,
        ...(generatedImageKey && { ':imageKey': generatedImageKey }),
      },
    }));
  }

  private itemToEntity(item: PosterItem): Poster {
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
      uploadedImageKey: item.uploadedImageKey,
      generatedImageKey: item.generatedImageKey,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
```

## Client Configuration

```typescript
// packages/db/src/client.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV === 'development' || process.env.USE_LOCALSTACK === 'true';

const baseClient = new DynamoDBClient(
  isLocal
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      }
    : {}
);

export const dynamoClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
```

## Common Access Patterns

### Get user's recent posters
```typescript
await posterRepo.listByUserId(userId, 10);
```

### Get all pending posters (for processing)
```typescript
const result = await client.send(new QueryCommand({
  TableName: TABLE_NAME,
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :status',
  ExpressionAttributeValues: {
    ':status': 'STATUS#PENDING',
  },
}));
```

### Get user profile with subscription
```typescript
const result = await client.send(new QueryCommand({
  TableName: TABLE_NAME,
  KeyConditionExpression: 'PK = :pk',
  ExpressionAttributeValues: {
    ':pk': `USER#${userId}`,
  },
}));
// Returns: [PROFILE item, SUB#xxx item, POSTER#xxx items...]
```

## Testing with LocalStack

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { PosterRepository } from './poster-repository';
import { dynamoClient } from '../client';

describe('PosterRepository', () => {
  let repo: PosterRepository;

  beforeAll(() => {
    process.env.USE_LOCALSTACK = 'true';
    repo = new PosterRepository(dynamoClient);
  });

  it('creates and retrieves a poster', async () => {
    const poster = await repo.create({
      userId: 'user-123',
      templateId: 'tmpl_001',
      status: 'PENDING',
      athleteName: 'Test Athlete',
      beltRank: 'blue',
      tournamentName: 'Test Tournament',
      tournamentDate: '2024-03-15',
      tournamentLocation: 'Austin, TX',
      uploadedImageKey: 'uploads/test.jpg',
    });

    expect(poster.posterId).toBeDefined();
    expect(poster.status).toBe('PENDING');

    const retrieved = await repo.getByUserId('user-123', poster.posterId);
    expect(retrieved).toEqual(poster);
  });
});
```

## Checklist

- [ ] Define entity schema with Zod
- [ ] Create DynamoDB item interface with key structure
- [ ] Implement repository with CRUD operations
- [ ] Handle key construction consistently
- [ ] Use GSI for alternative access patterns
- [ ] Write integration tests against LocalStack
