# Claude Code Configuration

This file configures Claude Code for the BJJ Poster App project. All team members should use Claude Code with this configuration for consistency.

## Project Context

This is a serverless AWS application for generating BJJ tournament posters. The tech stack is:

- **Frontend**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Backend**: AWS Lambda (TypeScript/Node.js 20)
- **Database**: DynamoDB (single-table design)
- **Storage**: S3
- **Queue**: SQS
- **AI**: Amazon Bedrock (image generation)
- **Auth**: Amazon Cognito
- **Payments**: Stripe
- **IaC**: AWS CDK (TypeScript)
- **Local Dev**: LocalStack

## Code Style Guidelines

### TypeScript

- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `unknown` instead of `any` where possible
- Destructure props and function parameters
- Use early returns to reduce nesting

### Naming Conventions

- **Files**: kebab-case (e.g., `create-poster.ts`)
- **Components**: PascalCase (e.g., `PosterBuilder.tsx`)
- **Functions**: camelCase (e.g., `createPoster`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `CreatePosterInput`)

### Lambda Handlers

All Lambda handlers should follow this pattern:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { logger } from '@bjj-poster/core';
import { createResponse, parseBody } from '../lib/api-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  logger.info('Handler invoked', { requestId, path: event.path });

  try {
    // 1. Parse and validate input
    const input = parseBody(event.body);
    
    // 2. Execute business logic
    const result = await doSomething(input);
    
    // 3. Return success response
    return createResponse(200, result);
  } catch (error) {
    logger.error('Handler failed', { requestId, error });
    return createResponse(500, { message: 'Internal server error' });
  }
};
```

### DynamoDB Access

Use the `@bjj-poster/db` package for all DynamoDB operations:

```typescript
import { db, UserEntity } from '@bjj-poster/db';

// Get user
const user = await db.users.get(userId);

// Create poster
await db.posters.create({
  userId,
  templateId,
  status: 'PENDING',
});
```

### Error Handling

- Use custom error classes from `@bjj-poster/core`
- Always log errors with context
- Return appropriate HTTP status codes
- Never expose internal error details to clients

## Package Structure

```
packages/
├── core/       # Shared utilities, types, error classes
├── db/         # DynamoDB client, entities, repositories
├── ui/         # Shared React components
└── config/     # ESLint, TypeScript configs
```

## Testing Requirements

- Unit tests for all business logic functions
- Integration tests for Lambda handlers (using LocalStack)
- E2E tests for critical user flows
- Minimum 80% code coverage for `packages/`

## Commit Message Format

Use conventional commits:

```
feat(api): add poster creation endpoint
fix(web): correct image upload validation
docs: update onboarding guide
test(db): add user repository tests
refactor(core): extract validation utilities
```

## Before Submitting a PR

1. Run `pnpm lint` - no errors
2. Run `pnpm type-check` - no errors
3. Run `pnpm test` - all tests pass
4. Run `pnpm build` - builds successfully
5. Update relevant documentation
