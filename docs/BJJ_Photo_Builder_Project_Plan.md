# BJJ Photo Builder

## Project Plan & Architecture Guide

**Version 1.0 | December 2024**

---

## Executive Summary

This document outlines the project plan for the BJJ Photo Builder application—a subscription-based SaaS platform that generates professional tournament posters and social media graphics for Brazilian Jiu-Jitsu athletes. The project serves three strategic objectives: demonstrating AWS cloud architecture expertise, providing a structured learning environment for junior developers, and delivering a production-grade application.

---

## Project Objectives

### 1. AWS Architecture Showcase

- Serverless-first architecture using Lambda, API Gateway, DynamoDB
- Infrastructure as Code with AWS CDK (TypeScript)
- Amazon Bedrock integration for AI-powered image generation
- Event-driven processing with EventBridge and SQS
- Multi-environment deployment (dev/staging/prod)

### 2. Junior Developer Training Platform

- Clear separation of concerns enabling parallel workstreams
- Comprehensive documentation and ADRs (Architecture Decision Records)
- Code review process with defined quality gates
- Structured onboarding with skill-building progression

### 3. Production-Grade Application

- Automated CI/CD pipeline with GitHub Actions
- Comprehensive testing strategy (unit, integration, e2e)
- Observability with CloudWatch, X-Ray, and structured logging
- Security-first design with Cognito, IAM least privilege, and secrets management

---

## Architecture Decision: Lambda over Spring Boot

Given your background in Java/Spring and the goal of training juniors, here's the rationale for choosing AWS Lambda with TypeScript/Node.js over a traditional Spring Boot application:

| Factor | Lambda + TypeScript | Spring Boot + Java |
|--------|--------------------|--------------------|
| **Cold Start** | ~100-200ms (Node.js) | ~3-10s without GraalVM; needs SnapStart |
| **Junior Learning** | Single function = single responsibility; easy to understand | Full framework knowledge required; steeper curve |
| **Cost** | Pay per invocation; free tier generous | Always-on EC2/ECS; min ~$15-50/mo |
| **Frontend Sync** | Same language (TS) front and back; shared types | Language context switch; OpenAPI for contract |
| **AWS Native** | First-class SDK support; CDK constructs | Works but not optimized for serverless |

**Recommendation:** Use TypeScript for Lambda functions. Your Java expertise translates well (strong typing, OOP patterns), and juniors benefit from seeing the same language across the stack. If you later need compute-heavy processing, you can add a Java Lambda for specific functions.

---

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 14 (App Router) + Tailwind + shadcn/ui                 │
│  Deployed: AWS Amplify Hosting                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────────┐
│                    API GATEWAY (REST)                            │
│  /auth/* → Cognito    /api/* → Lambda Functions                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ User     │ │ Poster   │ │ Template │ │ Billing  │           │
│  │ Service  │ │ Service  │ │ Service  │ │ Webhook  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
┌───────▼────────────▼────────────▼────────────▼──────────────────┐
│                    DATA & STORAGE                                │
│  DynamoDB          S3 (Assets)     Bedrock (AI)    Stripe       │
│  - Users           - Uploads       - Image Gen     - Payments   │
│  - Posters         - Generated     - Background    - Webhooks   │
│  - Templates       - Templates       Removal                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model (DynamoDB Single-Table Design)

Using single-table design for efficient access patterns—a key learning for juniors:

| Entity | PK | SK | Access Pattern |
|--------|----|----|----------------|
| User | `USER#<id>` | `PROFILE` | Get user by ID |
| Subscription | `USER#<id>` | `SUB#<stripe_id>` | Get user subscription |
| Poster | `USER#<id>` | `POSTER#<ts>` | List user's posters |
| Template | `TEMPLATE` | `<category>#<id>` | List templates by type |

---

## Poster Generation Flow (Deep Dive)

This is the core value proposition—understanding this flow is critical for all team members:

```
1. User submits form (athlete info + photo upload)
   └─► Frontend uploads photo directly to S3 (presigned URL)
   └─► Frontend calls POST /api/posters with metadata

2. CreatePoster Lambda
   └─► Validates user subscription tier
   └─► Creates PENDING poster record in DynamoDB
   └─► Publishes to SQS queue (async processing)
   └─► Returns poster ID immediately (202 Accepted)

3. ProcessPoster Lambda (triggered by SQS)
   └─► Fetches template definition from DynamoDB
   └─► Calls Bedrock for background generation/enhancement
   └─► Composites photo + text overlays using Sharp.js
   └─► Uploads final poster to S3
   └─► Updates DynamoDB record to COMPLETED

4. User polls GET /api/posters/{id} or uses WebSocket
   └─► Returns status + signed URL when ready
```

### Why Async Processing?

- **User Experience:** API responds immediately; no 30+ second waits
- **Reliability:** SQS provides automatic retry with exponential backoff
- **Scalability:** Decouple request rate from processing capacity
- **Cost:** Lambda concurrency limits prevent runaway Bedrock costs

---

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Repository setup, tooling alignment, and team onboarding

### Deliverables

1. Monorepo initialized with Turborepo + pnpm workspaces
2. AWS CDK infrastructure stack (dev environment only)
3. GitHub Actions CI pipeline (lint, test, type-check)
4. Team development environment standardized
5. ADR-001: Technology Stack Decisions

### Repository Structure

```
bjj-poster-app/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Lambda functions (shared package)
├── packages/
│   ├── core/                # Shared business logic
│   ├── db/                  # DynamoDB client + types
│   ├── ui/                  # Shared React components
│   └── config/              # ESLint, TS configs
├── infra/                   # AWS CDK stacks
├── docs/
│   ├── adr/                 # Architecture Decision Records
│   ├── onboarding/          # Junior developer guides
│   └── api/                 # OpenAPI specs
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

### Team Tool Standardization

All team members must use these tools for consistency:

| Tool | Purpose | Notes |
|------|---------|-------|
| **Claude Code** | AI-assisted development | Terminal-based; works with your IDE |
| **VS Code** | IDE | Required extensions in .vscode/extensions.json |
| **Node 20 LTS** | Runtime | Use nvm; .nvmrc in repo root |
| **pnpm** | Package manager | Faster than npm; built-in workspace support |
| **AWS CLI v2** | AWS access | Configure SSO for team accounts |
| **Docker** | Local DynamoDB + testing | docker-compose.yml in repo |

---

## Phase 2: Core Infrastructure (Weeks 3-4)

**Goal:** Deploy foundational AWS services and authentication

### Deliverables

1. Cognito User Pool with email verification
2. DynamoDB table with GSIs for access patterns
3. S3 buckets (uploads, generated assets) with lifecycle policies
4. API Gateway with Cognito authorizer
5. Basic Lambda functions (health check, user profile)

### CDK Stack Organization

```
infra/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── constructs/         # Reusable L3 constructs
│   │   ├── api-lambda.ts   # Standard Lambda + API GW pattern
│   │   └── secure-bucket.ts
│   ├── stacks/
│   │   ├── auth-stack.ts   # Cognito
│   │   ├── data-stack.ts   # DynamoDB + S3
│   │   ├── api-stack.ts    # API Gateway + Lambdas
│   │   └── ai-stack.ts     # Bedrock permissions
│   └── config/
│       └── environments.ts # Dev/staging/prod configs
└── cdk.json
```

### Junior Assignment: User Service Lambda

A well-scoped first Lambda for juniors to implement:

```typescript
// apps/api/src/handlers/user/get-profile.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getUserById } from '@bjj-poster/db';

export const handler: APIGatewayProxyHandler = async (event) => {
  // 1. Extract userId from Cognito authorizer context
  // 2. Fetch user from DynamoDB
  // 3. Return formatted response
  // Junior implements this with Claude Code assistance
};
```

---

## Phase 3: MVP Features (Weeks 5-8)

**Goal:** Working poster generation and subscription billing

### Deliverables

1. Next.js frontend with poster builder form
2. S3 presigned URL upload flow
3. Poster generation pipeline (SQS → Lambda → Bedrock)
4. 2 MVP poster templates
5. Stripe Checkout integration
6. User dashboard with poster history

### Stripe Integration Pattern

Using Stripe Checkout for MVP simplicity—can upgrade to Elements later:

```typescript
// Webhook handler for subscription events
// apps/api/src/handlers/billing/stripe-webhook.ts

export const handler = async (event: APIGatewayProxyEvent) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  const stripeEvent = stripe.webhooks.constructEvent(
    event.body!, sig!, webhookSecret!
  );
  
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      // Create/update subscription in DynamoDB
      break;
    case 'customer.subscription.updated':
      // Handle plan changes
      break;
    case 'customer.subscription.deleted':
      // Downgrade to free tier
      break;
  }
};
```

---

## Phase 4: Polish & Launch (Weeks 9-10)

**Goal:** Production hardening and gym beta launch

### Deliverables

1. Production CDK deployment with custom domain
2. CloudWatch dashboards and alarms
3. X-Ray tracing enabled
4. E2E test suite with Playwright
5. User documentation
6. Beta launch to gym members

---

## User Stories (MVP Scope)

Stories sized for 1-2 day implementation by a junior developer with Claude Code assistance.

### Epic: User Authentication

| ID     | Story                                                |
| ------ | ---------------------------------------------------- |
| US-001 | As a new user, I can sign up with email and password |
| US-002 | As a user, I can verify my email address             |
| US-003 | As a user, I can log in and log out                  |
| US-004 | As a user, I can reset my password                   |

### Epic: Poster Creation

| ID     | Story                                                                |
| ------ | -------------------------------------------------------------------- |
| US-010 | As an athlete, I can enter my profile info (name, belt, team)        |
| US-011 | As an athlete, I can upload a photo for my poster                    |
| US-012 | As an athlete, I can select a poster template                        |
| US-013 | As an athlete, I can enter tournament details (name, date, location) |
| US-014 | As an athlete, I can preview my poster before generation             |
| US-015 | As an athlete, I can generate my poster and see progress             |
| US-016 | As an athlete, I can download my completed poster                    |

### Epic: Subscription & Billing

| ID | Story |
|----|-------|
| US-020 | As a free user, I see watermarked low-res exports |
| US-021 | As a user, I can view subscription plans and pricing |
| US-022 | As a user, I can subscribe via Stripe Checkout |
| US-023 | As a pro user, I get HD exports without watermarks |
| US-024 | As a user, I can manage my subscription (cancel/upgrade) |

---

## Claude Code Usage Guide for Team

Standardized approach for using Claude Code across the team.

### Installation & Setup

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate (one-time)
claude auth login

# Navigate to project and start
cd bjj-poster-app
claude
```

### Effective Prompting Patterns

Teach juniors these patterns for consistent results:

#### Pattern 1: Context + Task + Constraints

```
"I'm implementing US-011 (photo upload). 
The photo should upload directly to S3 using a presigned URL.
Use the existing @bjj-poster/db package for DynamoDB.
Follow the error handling pattern in get-profile.ts."
```

#### Pattern 2: Show, Don't Tell

```
"Here's our existing Lambda handler pattern:
[paste example code]
Create a similar handler for the poster creation endpoint."
```

#### Pattern 3: Incremental Implementation

```
"Let's implement the poster service step by step:
1. First, create the DynamoDB type definitions
2. Then the repository functions
3. Finally the Lambda handler
Start with step 1."
```

### Code Review with Claude Code

Before submitting PRs, juniors should ask Claude Code to review:

```
"Review this Lambda handler for:
- Security issues (input validation, IAM)
- Error handling completeness
- TypeScript best practices
- Consistency with our existing patterns"
```

---

## Immediate Next Steps

Actions to take this week:

1. **Create GitHub repository** with branch protection rules and required reviews
2. **Initialize Turborepo monorepo** with the folder structure defined above
3. **Set up AWS Organization** with separate dev account for juniors (cost controls!)
4. **Create onboarding checklist** for juniors (tools, access, first PR)
5. **Write ADR-001** documenting the Lambda/TypeScript decision
6. **Schedule kick-off meeting** to walk juniors through architecture

---

## Local Lambda Development with LocalStack

LocalStack emulates AWS services locally, giving you a full development environment with DynamoDB, S3, SQS, Lambda, and API Gateway — all running on your machine.

### Why LocalStack?

- **Full AWS parity:** Test real service interactions, not mocks
- **No AWS costs:** Develop without burning cloud credits
- **Offline capable:** Work without internet connectivity
- **Team consistency:** Everyone runs the same local environment

### Docker Compose Setup

```yaml
# docker-compose.yml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"           # LocalStack Gateway
      - "4510-4559:4510-4559" # External service ports
    environment:
      - SERVICES=dynamodb,s3,sqs,lambda,apigateway,iam,logs
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack-data:/var/lib/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./scripts/localstack-init:/etc/localstack/init/ready.d"  # Auto-init scripts
  
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://localstack:4566
    depends_on:
      - localstack
```

### Initialization Script

Create resources automatically when LocalStack starts:

```bash
# scripts/localstack-init/init-aws.sh
#!/bin/bash

echo "Creating DynamoDB table..."
awslocal dynamodb create-table \
  --table-name bjj-poster-app \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST

echo "Creating S3 buckets..."
awslocal s3 mb s3://bjj-poster-uploads
awslocal s3 mb s3://bjj-poster-generated

echo "Creating SQS queue..."
awslocal sqs create-queue --queue-name poster-generation-queue

echo "LocalStack initialization complete!"
```

```bash
# Make it executable
chmod +x scripts/localstack-init/init-aws.sh
```

### AWS SDK Configuration

Configure your app to use LocalStack in development:

```typescript
// packages/db/src/client.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

const isLocal = process.env.NODE_ENV === 'development';

const localConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};

export const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(isLocal ? localConfig : {})
);

export const s3Client = new S3Client(isLocal ? localConfig : {});

export const sqsClient = new SQSClient(isLocal ? localConfig : {});
```

### Running Locally

```bash
# Start LocalStack and DynamoDB Admin UI
docker-compose up -d

# Verify services are running
curl http://localhost:4566/_localstack/health

# View DynamoDB tables in browser
open http://localhost:8001

# Run your API locally (connects to LocalStack)
cd apps/api
NODE_ENV=development pnpm dev
```

### Deploying Lambdas to LocalStack

For full Lambda testing, deploy your functions to LocalStack:

```bash
# Package your Lambda
cd apps/api
pnpm build
zip -r function.zip dist/

# Deploy to LocalStack
awslocal lambda create-function \
  --function-name CreatePosterFunction \
  --runtime nodejs20.x \
  --handler dist/handlers/poster/create-poster.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::000000000000:role/lambda-role

# Create API Gateway
awslocal apigateway create-rest-api --name bjj-poster-api

# Test the function
awslocal lambda invoke \
  --function-name CreatePosterFunction \
  --payload '{"body": "{\"athleteName\": \"Test\"}"}' \
  output.json
```

### Useful Commands Cheat Sheet

```bash
# LocalStack CLI (awslocal = aws --endpoint-url=http://localhost:4566)
alias awslocal='aws --endpoint-url=http://localhost:4566'

# List DynamoDB tables
awslocal dynamodb list-tables

# Scan a table
awslocal dynamodb scan --table-name bjj-poster-app

# List S3 buckets
awslocal s3 ls

# Check SQS queue
awslocal sqs receive-message --queue-url http://localhost:4566/000000000000/poster-generation-queue

# View Lambda logs
awslocal logs describe-log-groups
awslocal logs tail /aws/lambda/CreatePosterFunction

# Reset everything (nuclear option)
docker-compose down -v && docker-compose up -d
```

### Package Scripts

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch src/local-server.ts",
    "localstack:up": "docker-compose up -d",
    "localstack:down": "docker-compose down",
    "localstack:reset": "docker-compose down -v && docker-compose up -d",
    "localstack:logs": "docker-compose logs -f localstack",
    "test": "vitest",
    "test:integration": "docker-compose up -d && vitest run --config vitest.integration.config.ts"
  }
}
```

### Junior Developer Workflow

1. **First time setup:** Clone repo, run `docker-compose up -d`
2. **Daily development:** Run `pnpm dev` — API connects to LocalStack automatically
3. **View data:** Open http://localhost:8001 to browse DynamoDB
4. **Reset if stuck:** Run `pnpm localstack:reset` for a clean slate
5. **Before PR:** Ensure `pnpm test:integration` passes

---

## Appendix A: Technology Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | React ecosystem, SSR, file-based routing |
| Styling | Tailwind + shadcn/ui | Rapid development, consistent design |
| Backend | AWS Lambda (Node.js 20) | Serverless, pay-per-use, fast cold starts |
| Language | TypeScript | Type safety, same language front/back |
| API | API Gateway (REST) | Managed, scales automatically |
| Auth | Amazon Cognito | Managed user pools, JWT tokens |
| Database | DynamoDB | Serverless, single-table design |
| Storage | S3 | Object storage for images |
| AI | Amazon Bedrock | Managed AI, no GPU provisioning |
| Payments | Stripe | Industry standard, excellent DX |
| IaC | AWS CDK (TypeScript) | Same language as app code |
| CI/CD | GitHub Actions | Native GitHub integration |
| Monorepo | Turborepo + pnpm | Fast builds, workspace support |

---

## Appendix B: Estimated Costs (MVP Phase)

| Service | Monthly Estimate | Notes |
|---------|------------------|-------|
| Lambda | $0-5 | Free tier covers 1M requests |
| API Gateway | $0-3 | Free tier covers 1M requests |
| DynamoDB | $0-5 | On-demand, pay per request |
| S3 | $1-5 | Storage + transfer |
| Cognito | $0 | Free for first 50k MAU |
| Bedrock | $10-50 | Depends on generation volume |
| Amplify Hosting | $0-5 | Build minutes + hosting |
| **Total** | **~$15-75/mo** | During development/beta |

---

## Appendix C: Security Checklist

- [ ] Cognito user pool with MFA option
- [ ] API Gateway with Cognito authorizer
- [ ] Lambda IAM roles with least privilege
- [ ] S3 buckets with blocked public access
- [ ] Secrets in AWS Secrets Manager (not env vars)
- [ ] WAF rules on API Gateway (production)
- [ ] CloudTrail enabled for audit logging
- [ ] VPC endpoints for DynamoDB/S3 (production)

---

*Ready to proceed? I can help you create any of these artifacts—the repo scaffold, CDK stacks, onboarding docs, or detailed user story acceptance criteria.*
