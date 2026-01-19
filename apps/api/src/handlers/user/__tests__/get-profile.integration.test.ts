/**
 * Integration tests for get-profile handler
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
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Set environment before importing handler
process.env.USE_LOCALSTACK = 'true';
process.env.DYNAMODB_TABLE_NAME = 'bjj-poster-app-test';

// Dynamic import to ensure env vars are set first
const { handler } = await import('../get-profile.js');

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

// Test user with pro subscription
const testUser = {
  PK: 'USER#user-profile-test',
  SK: 'PROFILE',
  entityType: 'USER',
  userId: 'user-profile-test',
  email: 'profile@test.com',
  name: 'Profile Test User',
  subscriptionTier: 'pro',
  postersThisMonth: 5,
  usageResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

function createEvent(
  userId: string | null,
  email?: string
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
      requestId: 'integration-test-request',
      authorizer: userId
        ? {
            claims: {
              sub: userId,
              email: email || 'test@example.com',
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

describe('getProfile handler (integration)', () => {
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

    // Seed test user
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: testUser,
      })
    );
  });

  afterAll(async () => {
    try {
      await localClient.send(
        new DeleteTableCommand({
          TableName: TABLE_NAME,
        })
      );
    } catch (error) {
      // Log cleanup errors to help debug test environment issues
      console.error('Test cleanup failed:', error);
    }
  });

  it('returns profile for existing user from DynamoDB', async () => {
    const event = createEvent('user-profile-test', 'profile@test.com');
    const result = await handler(event, mockContext, () => {});

    expect(result).toBeDefined();
    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe('user-profile-test');
    expect(body.user.email).toBe('profile@test.com');
    expect(body.user.name).toBe('Profile Test User');
    expect(body.subscription.tier).toBe('pro');
    expect(body.quota.used).toBe(5);
    expect(body.quota.limit).toBe(20); // Pro tier limit
    expect(body.quota.remaining).toBe(15);
    expect(body.quota).toHaveProperty('resetsAt');
  });

  it('updates lastActiveAt in database', async () => {
    // Get user before
    const beforeResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: 'USER#user-profile-test', SK: 'PROFILE' },
      })
    );
    const beforeLastActive = beforeResult.Item?.lastActiveAt;
    const beforeTimestamp = beforeLastActive ? new Date(beforeLastActive).getTime() : 0;

    // Small delay to ensure timestamp differs
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Call handler
    const event = createEvent('user-profile-test');
    await handler(event, mockContext, () => {});

    // Poll for lastActiveAt update with timeout (more reliable than fixed delay)
    const maxAttempts = 10;
    const pollInterval = 100;
    let lastActiveAt: string | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: 'USER#user-profile-test', SK: 'PROFILE' },
        })
      );

      lastActiveAt = result.Item?.lastActiveAt;
      if (lastActiveAt && new Date(lastActiveAt).getTime() > beforeTimestamp) {
        break;
      }
    }

    expect(lastActiveAt).toBeDefined();
    expect(new Date(lastActiveAt!).getTime()).toBeGreaterThan(beforeTimestamp);
  });

  it('returns default free tier for non-existent user', async () => {
    const event = createEvent('non-existent-user', 'new@example.com');
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(200);

    const body = JSON.parse(result!.body);
    expect(body.user.id).toBe('non-existent-user');
    expect(body.user.email).toBe('new@example.com');
    expect(body.user.name).toBeUndefined();
    expect(body.subscription.tier).toBe('free');
    expect(body.quota.used).toBe(0);
    expect(body.quota.limit).toBe(2); // Free tier limit
  });

  it('returns 401 for unauthenticated request', async () => {
    const event = createEvent(null);
    const result = await handler(event, mockContext, () => {});

    expect(result!.statusCode).toBe(401);

    const body = JSON.parse(result!.body);
    expect(body.message).toBe('Unauthorized');
  });
});
