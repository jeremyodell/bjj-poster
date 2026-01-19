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

// Dynamic import to ensure env vars are set first
const { handler } = await import('../list-templates.js');

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
