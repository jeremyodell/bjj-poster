# BJJ Photo Builder

> Professional tournament poster generator for Brazilian Jiu-Jitsu athletes

[![CI](https://github.com/YOUR_ORG/bjj-poster-app/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/bjj-poster-app/actions/workflows/ci.yml)

## Overview

BJJ Photo Builder is a subscription-based SaaS application that generates professional tournament posters and social media graphics for BJJ athletes. Upload a photo, enter tournament details, and get a competition-ready poster in seconds.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | AWS Lambda, API Gateway |
| Database | DynamoDB (single-table design) |
| Storage | S3 |
| Auth | Amazon Cognito |
| AI | Amazon Bedrock |
| Payments | Stripe |
| IaC | AWS CDK |
| Local Dev | LocalStack |

## Quick Start

### Prerequisites

- Node.js 20+ (use nvm)
- pnpm 9+
- Docker Desktop
- AWS CLI v2

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/bjj-poster-app.git
cd bjj-poster-app

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start LocalStack
docker-compose up -d

# Start development servers
pnpm dev
```

- Web app: http://localhost:3000
- API: http://localhost:3001
- DynamoDB Admin: http://localhost:8001

## Project Structure

```
bjj-poster-app/
├── apps/
│   ├── api/              # Lambda functions
│   └── web/              # Next.js frontend
├── packages/
│   ├── core/             # Shared utilities
│   ├── db/               # DynamoDB client
│   ├── ui/               # React components
│   └── config/           # Shared configs
├── infra/                # AWS CDK stacks
├── docs/                 # Documentation
├── .claude/              # Claude Code config
│   └── skills/           # Shared Claude skills
└── scripts/              # Utility scripts
```

## Development

### Commands

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm type-check       # TypeScript check

# LocalStack
pnpm localstack:up    # Start LocalStack
pnpm localstack:down  # Stop LocalStack
pnpm localstack:reset # Reset all data
```

### Using Claude Code

This project is configured for [Claude Code](https://www.anthropic.com/claude-code). See `CLAUDE.md` for coding standards and `.claude/skills/` for reusable patterns.

```bash
# Start Claude Code in project root
claude
```

## Documentation

- [Onboarding Guide](docs/onboarding/getting-started.md) - New developer setup
- [Architecture Decision Records](docs/adr/) - Key technical decisions
- [API Documentation](docs/api/) - API specifications

## Deployment

```bash
# Deploy to dev
cd infra
pnpm cdk deploy --all --context stage=dev

# Deploy to production
pnpm cdk deploy --all --context stage=prod
```

## Contributing

1. Create a feature branch: `git checkout -b feat/US-XXX-description`
2. Make changes following our [coding standards](CLAUDE.md)
3. Run checks: `pnpm lint && pnpm type-check && pnpm test`
4. Commit with conventional commits: `git commit -m "feat(api): add feature"`
5. Push and create PR

## License

Proprietary - All rights reserved
