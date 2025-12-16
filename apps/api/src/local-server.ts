/**
 * Local development server that wraps Lambda handlers in Express
 * This allows frontend integration testing without deploying to AWS
 */

import express, { Request, Response, NextFunction } from 'express';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Import handlers as they're created
// import { handler as getProfile } from './handlers/user/get-profile';
// import { handler as createPoster } from './handlers/poster/create-poster';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  // CORS for local development
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * Adapter to convert Express request to Lambda event format
 */
function createLambdaEvent(req: Request): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: req.query as Record<string, string>,
    headers: req.headers as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    requestContext: {
      requestId: `local-${Date.now()}`,
      authorizer: {
        // Mock Cognito authorizer for local dev
        claims: {
          sub: process.env.LOCAL_USER_ID || 'local-dev-user-123',
          email: 'dev@example.com',
        },
      },
    } as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
  };
}

/**
 * Mock Lambda context
 */
function createLambdaContext(): Context {
  return {
    functionName: 'local-dev',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:local-dev',
    memoryLimitInMB: '256',
    awsRequestId: `local-${Date.now()}`,
    logGroupName: '/aws/lambda/local-dev',
    logStreamName: 'local',
    callbackWaitsForEmptyEventLoop: false,
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

/**
 * Wrap a Lambda handler to work with Express
 */
function lambdaAdapter(handler: LambdaHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = createLambdaEvent(req);
      const context = createLambdaContext();
      
      const result = await handler(event, context);
      
      // Set response headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, String(value));
        });
      }
      
      res.status(result.statusCode);
      
      if (result.body) {
        res.json(JSON.parse(result.body));
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Handler error:', error);
      next(error);
    }
  };
}

// ===========================================
// Routes - Add handlers as they're created
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'local',
  });
});

// Example routes (uncomment as handlers are implemented):
// app.get('/api/users/:id', lambdaAdapter(getProfile));
// app.post('/api/posters', lambdaAdapter(createPoster));
// app.get('/api/posters', lambdaAdapter(listPosters));
// app.get('/api/posters/:id', lambdaAdapter(getPoster));
// app.get('/api/templates', lambdaAdapter(listTemplates));
// app.post('/api/uploads/presigned-url', lambdaAdapter(getPresignedUrl));

// Placeholder routes for development
app.get('/api/users/:id', (req, res) => {
  res.json({
    userId: req.params.id,
    email: 'dev@example.com',
    name: 'Dev User',
    subscriptionTier: 'free',
    createdAt: new Date().toISOString(),
  });
});

app.get('/api/templates', (req, res) => {
  res.json([
    {
      templateId: 'tmpl_001',
      name: 'Classic Tournament',
      description: 'Bold text with action photo background',
      category: 'tournament',
      isPremium: false,
    },
    {
      templateId: 'tmpl_002',
      name: 'Modern Gradient',
      description: 'Clean gradient background with centered athlete',
      category: 'tournament',
      isPremium: true,
    },
  ]);
});

app.get('/api/posters', (req, res) => {
  res.json([]);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🥋 BJJ Poster API - Local Development Server');
  console.log('============================================');
  console.log(`API running at: http://localhost:${PORT}`);
  console.log(`Health check:   http://localhost:${PORT}/health`);
  console.log('');
  console.log('Environment:');
  console.log(`  NODE_ENV:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`  LocalStack:   ${process.env.USE_LOCALSTACK === 'true' ? 'enabled' : 'disabled'}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
