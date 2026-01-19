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
