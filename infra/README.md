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
