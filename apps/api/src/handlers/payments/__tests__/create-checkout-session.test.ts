import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../create-checkout-session.js';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/pay/cs_test_123',
          }),
        },
      },
    })),
  };
});

// Mock price config
vi.mock('../price-config.js', () => ({
  getPriceId: vi.fn().mockReturnValue('price_pro_monthly'),
}));

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    path: '/payments/checkout',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'pro', interval: 'month' }),
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

const mockContext: Context = {
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:test',
  memoryLimitInMB: '256',
  awsRequestId: 'test-123',
  logGroupName: 'test',
  logStreamName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('createCheckoutSession handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('creates checkout session with valid request', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
  });

  it('returns 400 for invalid tier', async () => {
    const event = createEvent({
      body: JSON.stringify({ tier: 'enterprise', interval: 'month' }),
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Invalid');
  });

  it('returns 401 when user not authenticated', async () => {
    const event = createEvent({
      requestContext: {
        requestId: 'test-123',
        authorizer: null,
      } as any,
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when body is missing', async () => {
    const event = createEvent({ body: null });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
  });
});
