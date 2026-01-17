import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock all dependencies before importing handler
vi.mock('@bjj-poster/core', () => ({
  composePoster: vi.fn().mockResolvedValue({
    buffer: Buffer.from('fake-poster-data'),
  }),
  initBundledFonts: vi.fn().mockResolvedValue(undefined),
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

describe('generatePoster handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with poster on success', async () => {
    const event = createEvent();
    const result = await handler(event);

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
    const result = await handler(event);

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
    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('QUOTA_EXCEEDED');
    expect(body.usage.used).toBe(2);
  });

  it('returns 400 when body is missing', async () => {
    const event = createEvent({ body: null });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('MISSING_BODY');
  });

  it('returns 400 when content-type is wrong', async () => {
    const event = createEvent({
      headers: { 'content-type': 'application/json' },
    });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('INVALID_CONTENT_TYPE');
  });

  it('handles OPTIONS preflight', async () => {
    const event = createEvent({ httpMethod: 'OPTIONS' });
    const result = await handler(event);

    expect(result.statusCode).toBe(204);
    expect(result.headers?.['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('includes CORS headers in response', async () => {
    const event = createEvent();
    const result = await handler(event);

    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
