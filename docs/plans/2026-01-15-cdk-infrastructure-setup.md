# CDK Infrastructure Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up complete AWS infrastructure using CDK v2 with separate stacks for API, Database, Storage, supporting dev and production environments

**Architecture:** Modular CDK stacks (Database, Storage, API) with environment-specific configuration, Lambda functions deployed via NodejsFunction construct, DynamoDB single-table design, S3 buckets with CORS, API Gateway with throttling

**Tech Stack:** AWS CDK v2, TypeScript, AWS Lambda, DynamoDB, S3, API Gateway, Vitest

---

## Task 1: CDK Project Initialization and Configuration

### Step 1: Initialize CDK project structure

**Directory:** `infra/`

```bash
mkdir -p infra
cd infra
pnpm init
pnpm add -D aws-cdk aws-cdk-lib constructs @types/node typescript
```

### Step 2: Create CDK configuration

**File:** `infra/cdk.json`

```json
{
  "app": "node bin/bjj-poster-app.js",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

### Step 3: Create TypeScript config

**File:** `infra/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### Step 4: Create environment config types

**File:** `infra/lib/config/types.ts`

```typescript
export interface EnvironmentConfig {
  stage: 'dev' | 'prod';
  region: string;
  account: string;
  apiDomain: string;
  webDomain: string;
  apiThrottleRate: number;
  apiThrottleBurst: number;
  lambdaMemory: number;
  lambdaTimeout: number;
  dynamoDbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  posterBucketName: string;
  cognitoUserPoolName: string;
  enableCdn: boolean;
}
```

### Step 5: Create dev environment config

**File:** `infra/lib/config/dev.ts`

```typescript
import { EnvironmentConfig } from './types';

export const devConfig: EnvironmentConfig = {
  stage: 'dev',
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  apiDomain: 'api-dev.bjjposter.app',
  webDomain: 'dev.bjjposter.app',
  apiThrottleRate: 100,
  apiThrottleBurst: 200,
  lambdaMemory: 1024,
  lambdaTimeout: 30,
  dynamoDbBillingMode: 'PAY_PER_REQUEST',
  posterBucketName: 'bjj-poster-app-dev-posters',
  cognitoUserPoolName: 'bjj-poster-app-dev',
  enableCdn: false
};
```

### Step 6: Create prod environment config

**File:** `infra/lib/config/prod.ts`

```typescript
import { EnvironmentConfig } from './types';

export const prodConfig: EnvironmentConfig = {
  stage: 'prod',
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  apiDomain: 'api.bjjposter.app',
  webDomain: 'bjjposter.app',
  apiThrottleRate: 1000,
  apiThrottleBurst: 2000,
  lambdaMemory: 2048,
  lambdaTimeout: 30,
  dynamoDbBillingMode: 'PAY_PER_REQUEST',
  posterBucketName: 'bjj-poster-app-prod-posters',
  cognitoUserPoolName: 'bjj-poster-app-prod',
  enableCdn: true
};
```

### Step 7: Test CDK synth (expect FAIL)

```bash
cd infra
pnpm cdk synth --context stage=dev
```

**Expected output:** FAIL - No stacks defined yet

### Step 8: Commit

```bash
git add infra/
git commit -m "feat(infra): initialize CDK project with environment configs"
```

---

## Task 2: Database Stack

### Step 1: Create Database Stack

**File:** `infra/lib/database-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'MainTable', {
      tableName: `bjj-poster-app-${config.stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: config.dynamoDbBillingMode === 'PAY_PER_REQUEST'
        ? dynamodb.BillingMode.PAY_PER_REQUEST
        : dynamodb.BillingMode.PROVISIONED,
      removalPolicy: config.stage === 'dev'
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: config.stage === 'prod',
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      exportName: `${config.stage}-TableName`
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      exportName: `${config.stage}-TableArn`
    });
  }
}
```

### Step 2: Test CDK synth (expect partial success)

```bash
cd infra
pnpm cdk synth --context stage=dev
```

**Expected output:** Should synth but warn about no app defined

### Step 3: Commit

```bash
git add infra/lib/database-stack.ts
git commit -m "feat(infra): add DynamoDB single-table stack"
```

---

## Task 3: Storage Stack

### Step 1: Create Storage Stack

**File:** `infra/lib/storage-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';

export class StorageStack extends cdk.Stack {
  public readonly posterBucket: s3.Bucket;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    this.posterBucket = new s3.Bucket(this, 'PosterBucket', {
      bucketName: config.posterBucketName,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30)
        }
      ],
      removalPolicy: config.stage === 'dev'
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: config.stage === 'dev',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: config.stage === 'dev'
            ? ['http://localhost:3000', `https://${config.webDomain}`]
            : [`https://${config.webDomain}`],
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });

    new cdk.CfnOutput(this, 'PosterBucketName', {
      value: this.posterBucket.bucketName,
      exportName: `${config.stage}-PosterBucketName`
    });

    new cdk.CfnOutput(this, 'PosterBucketArn', {
      value: this.posterBucket.bucketArn,
      exportName: `${config.stage}-PosterBucketArn`
    });
  }
}
```

### Step 2: Test CDK synth

```bash
cd infra
pnpm cdk synth --context stage=dev
```

**Expected output:** Should synth successfully

### Step 3: Commit

```bash
git add infra/lib/storage-stack.ts
git commit -m "feat(infra): add S3 storage stack for posters"
```

---

## Task 4: API Stack

### Step 1: Create API Stack

**File:** `infra/lib/api-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';
import * as path from 'path';

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    table: dynamodb.Table,
    posterBucket: s3.Bucket,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `bjj-poster-app-${config.stage}`,
      description: `BJJ Poster App API (${config.stage})`,
      deployOptions: {
        stageName: config.stage,
        throttlingRateLimit: config.apiThrottleRate,
        throttlingBurstLimit: config.apiThrottleBurst,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: config.stage === 'dev',
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: config.stage === 'dev'
          ? ['http://localhost:3000', `https://${config.webDomain}`]
          : [`https://${config.webDomain}`],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    const commonEnv = {
      TABLE_NAME: table.tableName,
      POSTER_BUCKET_NAME: posterBucket.bucketName,
      STAGE: config.stage
    };

    // Generate Poster Lambda
    const generatePosterFn = new nodejs.NodejsFunction(this, 'GeneratePoster', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/posters/generate-poster.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: config.lambdaMemory,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      environment: commonEnv
    });

    table.grantReadWriteData(generatePosterFn);
    posterBucket.grantReadWrite(generatePosterFn);

    // Get Templates Lambda
    const getTemplatesFn = new nodejs.NodejsFunction(this, 'GetTemplates', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/templates/get-templates.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadData(getTemplatesFn);

    // Get User Posters Lambda
    const getUserPostersFn = new nodejs.NodejsFunction(this, 'GetUserPosters', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/posters/get-user-posters.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadData(getUserPostersFn);

    // Get User Profile Lambda
    const getUserProfileFn = new nodejs.NodejsFunction(this, 'GetUserProfile', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/user/get-profile.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadWriteData(getUserProfileFn);

    // API Routes
    const posters = this.api.root.addResource('posters');
    posters.addMethod('POST', new apigateway.LambdaIntegration(generatePosterFn));
    posters.addMethod('GET', new apigateway.LambdaIntegration(getUserPostersFn));

    const templates = this.api.root.addResource('templates');
    templates.addMethod('GET', new apigateway.LambdaIntegration(getTemplatesFn));

    const user = this.api.root.addResource('user');
    const profile = user.addResource('profile');
    profile.addMethod('GET', new apigateway.LambdaIntegration(getUserProfileFn));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `${config.stage}-ApiUrl`
    });
  }
}
```

### Step 2: Test CDK synth

```bash
cd infra
pnpm cdk synth --context stage=dev
```

**Expected output:** Should synth successfully

### Step 3: Commit

```bash
git add infra/lib/api-stack.ts
git commit -m "feat(infra): add API Gateway stack with Lambda functions"
```

---

## Task 5: Main CDK App

### Step 1: Create main CDK app entry point

**File:** `infra/bin/bjj-poster-app.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { devConfig } from '../lib/config/dev';
import { prodConfig } from '../lib/config/prod';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'dev';
const config = stage === 'prod' ? prodConfig : devConfig;

const env = {
  account: config.account,
  region: config.region
};

const databaseStack = new DatabaseStack(app, `BjjPosterDatabase-${stage}`, config, { env });
const storageStack = new StorageStack(app, `BjjPosterStorage-${stage}`, config, { env });
const apiStack = new ApiStack(
  app,
  `BjjPosterApi-${stage}`,
  config,
  databaseStack.table,
  storageStack.posterBucket,
  { env }
);

apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

cdk.Tags.of(app).add('Project', 'BJJ Poster App');
cdk.Tags.of(app).add('Environment', stage);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
```

### Step 2: Add build script to package.json

**File:** `infra/package.json`

Update scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk"
  }
}
```

### Step 3: Test CDK synth (expect PASS)

```bash
cd infra
pnpm build
pnpm cdk synth --context stage=dev
```

**Expected output:** PASS - All stacks synthesized successfully

### Step 4: Test CDK synth for prod

```bash
cd infra
pnpm cdk synth --context stage=prod
```

**Expected output:** PASS

### Step 5: Commit

```bash
git add infra/bin/bjj-poster-app.ts infra/package.json
git commit -m "feat(infra): add main CDK app with stack orchestration"
```

---

## Task 6: Deployment Scripts

### Step 1: Create deployment script

**File:** `infra/scripts/deploy.sh`

```bash
#!/bin/bash
set -e

STAGE=${1:-dev}

echo "Deploying to $STAGE environment..."

# Build TypeScript
pnpm build

# Deploy all stacks
pnpm cdk deploy --all --context stage=$STAGE --require-approval never

echo "Deployment complete!"
echo "API URL: $(pnpm cdk output BjjPosterApi-$STAGE.ApiUrl --context stage=$STAGE)"
```

### Step 2: Create destroy script

**File:** `infra/scripts/destroy.sh`

```bash
#!/bin/bash
set -e

STAGE=${1:-dev}

echo "WARNING: This will destroy all resources in $STAGE environment"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

pnpm cdk destroy --all --context stage=$STAGE --force

echo "Destruction complete!"
```

### Step 3: Make scripts executable

```bash
chmod +x infra/scripts/deploy.sh
chmod +x infra/scripts/destroy.sh
```

### Step 4: Test synth one final time

```bash
cd infra
pnpm build
pnpm cdk synth --context stage=dev
```

**Expected output:** PASS

### Step 5: Commit

```bash
git add infra/scripts/
git commit -m "feat(infra): add deployment and destroy scripts"
```

---

## Task 7: Documentation

### Step 1: Create deployment README

**File:** `infra/README.md`

```markdown
# BJJ Poster App Infrastructure

AWS CDK infrastructure for the BJJ Poster App.

## Prerequisites

- AWS CLI configured
- Node.js 20+
- pnpm

## Setup

```bash
cd infra
pnpm install
pnpm build
```

## Bootstrap (First Time Only)

```bash
pnpm cdk bootstrap --context stage=dev
pnpm cdk bootstrap --context stage=prod
```

## Deploy

### Dev Environment
```bash
./scripts/deploy.sh dev
```

### Prod Environment
```bash
./scripts/deploy.sh prod
```

## Stacks

- **DatabaseStack**: DynamoDB single-table design
- **StorageStack**: S3 buckets for posters
- **ApiStack**: API Gateway + Lambda functions

## Outputs

After deployment, get stack outputs:

```bash
pnpm cdk output --all --context stage=dev
```
```

### Step 2: Test final synth

```bash
cd infra
pnpm cdk synth --all --context stage=dev
```

**Expected output:** PASS - 3 stacks synthesized

### Step 3: Commit

```bash
git add infra/README.md
git commit -m "docs(infra): add deployment documentation"
```

---

## Task 8: CDN Stack (Production Only)

### Step 1: Create CDN Stack

**File:** `infra/lib/cdn-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';

export class CdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    posterBucket: s3.Bucket,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Only create CloudFront in production
    if (config.stage !== 'prod') {
      return;
    }

    // Certificate for custom domain (must be in us-east-1)
    // NOTE: You'll need to manually create this in ACM first
    // const certificate = acm.Certificate.fromCertificateArn(
    //   this,
    //   'Certificate',
    //   'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID'
    // );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `BJJ Poster App CDN (${config.stage})`,
      defaultBehavior: {
        origin: new origins.S3Origin(posterBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      // Uncomment when you have a certificate:
      // domainNames: [config.webDomain],
      // certificate: certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      enableLogging: true,
      logBucket: posterBucket,
      logFilePrefix: 'cloudfront-logs/',
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      exportName: `${config.stage}-DistributionDomainName`
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      exportName: `${config.stage}-DistributionId`
    });
  }
}
```

### Step 2: Update main CDK app to include CDN stack

**File:** `infra/bin/bjj-poster-app.ts`

Add after the API stack:

```typescript
import { CdnStack } from '../lib/cdn-stack';

// ... existing stacks ...

const cdnStack = new CdnStack(
  app,
  `BjjPosterCdn-${stage}`,
  config,
  storageStack.posterBucket,
  { env }
);

cdnStack.addDependency(storageStack);
```

### Step 3: Test CDK synth for prod (expect PASS)

```bash
cd infra
pnpm build
pnpm cdk synth --context stage=prod
```

**Expected output:** PASS - 4 stacks including CDN

### Step 4: Test CDK synth for dev (expect PASS, CDN skipped)

```bash
cd infra
pnpm cdk synth --context stage=dev
```

**Expected output:** PASS - 3 stacks (no CDN in dev)

### Step 5: Update README with CDN information

**File:** `infra/README.md`

Add section:

```markdown
## CloudFront CDN (Production Only)

The CDN stack is only deployed in production and serves:
- Frontend application assets (HTML, CSS, JS)
- Generated poster images from S3

### Custom Domain Setup

1. Request ACM certificate in us-east-1 for your domain
2. Update `infra/lib/cdn-stack.ts` with certificate ARN
3. Uncomment `domainNames` and `certificate` lines
4. Deploy: `./scripts/deploy.sh prod`
5. Update DNS to point to CloudFront distribution domain
```

### Step 6: Commit

```bash
git add infra/lib/cdn-stack.ts infra/bin/bjj-poster-app.ts infra/README.md
git commit -m "feat(infra): add CloudFront CDN stack for production"
```

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-01-15-cdk-infrastructure-setup.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
