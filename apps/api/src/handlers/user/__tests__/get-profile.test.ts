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
