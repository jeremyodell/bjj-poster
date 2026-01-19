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

// Test data: 5 posters for user-123, 1 for user-456
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
