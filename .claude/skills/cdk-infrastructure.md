# Skill: AWS CDK Infrastructure

Use this skill when creating or modifying AWS infrastructure using CDK.

## CDK Conventions

- Language: TypeScript
- CDK Version: v2
- Constructs: Use L2 constructs when available, L3 for custom patterns

## Stack Organization

```
infra/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── constructs/         # Reusable L3 constructs
│   │   ├── api-lambda.ts
│   │   └── secure-bucket.ts
│   ├── stacks/
│   │   ├── auth-stack.ts   # Cognito
│   │   ├── data-stack.ts   # DynamoDB + S3
│   │   ├── api-stack.ts    # API Gateway + Lambdas
│   │   └── ai-stack.ts     # Bedrock permissions
│   └── config/
│       └── environments.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

## CDK App Entry Point

```typescript
// infra/bin/app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DataStack } from '../lib/stacks/data-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { getEnvironmentConfig } from '../lib/config/environments';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'dev';
const config = getEnvironmentConfig(stage);

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region,
};

// Auth stack (Cognito)
const authStack = new AuthStack(app, `BjjPoster-Auth-${stage}`, {
  env,
  stage,
  ...config,
});

// Data stack (DynamoDB, S3)
const dataStack = new DataStack(app, `BjjPoster-Data-${stage}`, {
  env,
  stage,
  ...config,
});

// API stack (API Gateway, Lambdas)
const apiStack = new ApiStack(app, `BjjPoster-Api-${stage}`, {
  env,
  stage,
  userPool: authStack.userPool,
  table: dataStack.table,
  uploadsBucket: dataStack.uploadsBucket,
  generatedBucket: dataStack.generatedBucket,
  ...config,
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'BjjPoster');
cdk.Tags.of(app).add('Stage', stage);
```

## Environment Configuration

```typescript
// infra/lib/config/environments.ts
export interface EnvironmentConfig {
  stage: string;
  region: string;
  domainName?: string;
  logRetentionDays: number;
  lambdaMemory: number;
  lambdaTimeout: number;
}

const configs: Record<string, EnvironmentConfig> = {
  dev: {
    stage: 'dev',
    region: 'us-east-1',
    logRetentionDays: 7,
    lambdaMemory: 256,
    lambdaTimeout: 30,
  },
  staging: {
    stage: 'staging',
    region: 'us-east-1',
    domainName: 'staging.bjjposter.com',
    logRetentionDays: 14,
    lambdaMemory: 512,
    lambdaTimeout: 30,
  },
  prod: {
    stage: 'prod',
    region: 'us-east-1',
    domainName: 'bjjposter.com',
    logRetentionDays: 90,
    lambdaMemory: 1024,
    lambdaTimeout: 30,
  },
};

export function getEnvironmentConfig(stage: string): EnvironmentConfig {
  const config = configs[stage];
  if (!config) {
    throw new Error(`Unknown stage: ${stage}. Valid stages: ${Object.keys(configs).join(', ')}`);
  }
  return config;
}
```

## Auth Stack (Cognito)

```typescript
// infra/lib/stacks/auth-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface AuthStackProps extends cdk.StackProps {
  stage: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `bjj-poster-users-${props.stage}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client
    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: `bjj-poster-web-${props.stage}`,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: props.stage === 'prod'
          ? ['https://bjjposter.com/auth/callback']
          : ['http://localhost:3000/auth/callback'],
        logoutUrls: props.stage === 'prod'
          ? ['https://bjjposter.com']
          : ['http://localhost:3000'],
      },
      preventUserExistenceErrors: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: `BjjPoster-UserPoolId-${props.stage}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: `BjjPoster-UserPoolClientId-${props.stage}`,
    });
  }
}
```

## Data Stack (DynamoDB + S3)

```typescript
// infra/lib/stacks/data-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.StackProps {
  stage: string;
}

export class DataStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly uploadsBucket: s3.Bucket;
  public readonly generatedBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // DynamoDB Table (single-table design)
    this.table = new dynamodb.Table(this, 'MainTable', {
      tableName: `bjj-poster-app-${props.stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.stage === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.stage === 'prod',
    });

    // GSI for alternative access patterns
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // Uploads bucket (user-uploaded images)
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `bjj-poster-uploads-${props.stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: props.stage === 'prod'
            ? ['https://bjjposter.com']
            : ['http://localhost:3000'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldUploads',
          expiration: cdk.Duration.days(30),
          prefix: 'temp/',
        },
      ],
      removalPolicy: props.stage === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stage !== 'prod',
    });

    // Generated posters bucket
    this.generatedBucket = new s3.Bucket(this, 'GeneratedBucket', {
      bucketName: `bjj-poster-generated-${props.stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: props.stage === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stage !== 'prod',
    });

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      exportName: `BjjPoster-TableName-${props.stage}`,
    });
  }
}
```

## Custom L3 Construct: API Lambda

```typescript
// infra/lib/constructs/api-lambda.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiLambdaProps {
  stage: string;
  handlerPath: string;
  environment?: Record<string, string>;
  memorySize?: number;
  timeout?: cdk.Duration;
  logRetention?: logs.RetentionDays;
}

export class ApiLambda extends Construct {
  public readonly function: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    this.function = new lambdaNodejs.NodejsFunction(this, 'Function', {
      entry: path.join(__dirname, '../../..', 'apps/api/src', props.handlerPath),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: props.memorySize || 256,
      timeout: props.timeout || cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        STAGE: props.stage,
        ...props.environment,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
      logRetention: props.logRetention || logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
  }
}
```

## Deployment Commands

```bash
# Deploy dev environment
cd infra
pnpm cdk deploy --all --context stage=dev

# Deploy specific stack
pnpm cdk deploy BjjPoster-Api-dev --context stage=dev

# Diff before deploy
pnpm cdk diff --context stage=dev

# Destroy (non-prod only!)
pnpm cdk destroy --all --context stage=dev
```

## Checklist

- [ ] Use environment-specific configuration
- [ ] Set appropriate removal policies (RETAIN for prod)
- [ ] Add CloudFormation outputs for cross-stack references
- [ ] Enable encryption on all storage
- [ ] Configure CORS for S3 buckets
- [ ] Use least privilege IAM permissions
- [ ] Enable X-Ray tracing on Lambdas
- [ ] Set log retention policies
- [ ] Add resource tags for cost tracking
