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
