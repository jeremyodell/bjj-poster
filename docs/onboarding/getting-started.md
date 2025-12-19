# Developer Onboarding Guide

Welcome to the BJJ Poster App team! This guide will get you from zero to your first PR.

## Prerequisites

Before starting, make sure you have:

- [ ] macOS, Linux, or WSL2 on Windows
- [ ] Git installed
- [ ] GitHub account with repo access
- [ ] Anthropic account for Claude Code

## Step 1: Install Required Tools

### Node.js (via nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### pnpm

```bash
# Install pnpm
npm install -g pnpm

# Verify
pnpm --version  # Should show 9.x.x
```

### Docker Desktop

Download and install from: https://www.docker.com/products/docker-desktop

```bash
# Verify
docker --version
docker-compose --version
```

### AWS CLI v2

```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/

# Verify
aws --version
```

### Claude Code

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate
claude auth login

# Follow the prompts to connect your Anthropic account
```

### VS Code

Download from: https://code.visualstudio.com/

The repo includes recommended extensions - VS Code will prompt you to install them.

## Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/bjj-poster-app.git
cd bjj-poster-app

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start LocalStack (AWS services locally)
docker-compose up -d

# Wait for initialization (check logs)
docker-compose logs -f localstack

# When you see "LocalStack initialization complete!", press Ctrl+C
```

## Step 3: Verify Setup

```bash
# Check LocalStack is healthy
curl http://localhost:4566/_localstack/health

# Open DynamoDB Admin UI
open http://localhost:8001

# You should see the bjj-poster-app table with seed data
```

## Step 4: Run the Application

Open two terminals:

**Terminal 1 - API:**
```bash
cd apps/api
pnpm dev

# API running at http://localhost:3001
```

**Terminal 2 - Web:**
```bash
cd apps/web
pnpm dev

# Web app running at http://localhost:3000
```

## Step 5: Your First Task

### Using Claude Code

Navigate to the project root and start Claude Code:

```bash
cd bjj-poster-app
claude
```

Try asking Claude Code to help with your assigned task. Good prompts include:

```
"I'm working on US-001 (user signup). Show me the existing auth patterns in this codebase."

"Help me create a new Lambda handler for [feature]. Follow the patterns in .claude/skills/lambda-handler.md"

"Review my changes for security issues and TypeScript best practices."
```

### Making Changes

```bash
# Create a feature branch
git checkout -b feat/US-001-user-signup

# Make your changes...

# Run checks before committing
pnpm lint
pnpm type-check
pnpm test

# Commit with conventional commit message
git commit -m "feat(api): add user signup endpoint"

# Push and create PR
git push -u origin feat/US-001-user-signup
```

## Project Structure Overview

```
bjj-poster-app/
├── apps/
│   ├── api/          # Lambda functions (backend)
│   └── web/          # Next.js app (frontend)
├── packages/
│   ├── core/         # Shared utilities
│   ├── db/           # DynamoDB client
│   ├── ui/           # Shared React components
│   └── config/       # ESLint, TS configs
├── infra/            # AWS CDK (infrastructure)
├── docs/             # Documentation
├── .claude/          # Claude Code configuration
│   └── skills/       # Shared Claude skills
└── scripts/          # Utility scripts
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code configuration and coding standards |
| `.claude/skills/*.md` | Reusable patterns for common tasks |
| `.claude/commands/*.md` | Custom slash commands for scaffolding |
| `docker-compose.yml` | LocalStack and local services |
| `turbo.json` | Monorepo task configuration |
| `.env.example` | Environment variables template |

## Claude Code Skills & Commands

We've created custom skills and commands to help you write consistent, high-quality code. Claude Code automatically uses these when relevant.

### Skills

Skills are reference documents that teach Claude our patterns. You don't invoke them directly—Claude uses them automatically when you're working on related tasks.

| Skill | When It's Used |
|-------|----------------|
| **lambda-handler.md** | Creating API endpoints, SQS consumers, EventBridge handlers |
| **dynamodb-operations.md** | Writing DynamoDB queries, repository functions |
| **react-component.md** | Building React/Next.js components |
| **cdk-infrastructure.md** | Writing AWS CDK stacks and constructs |
| **image-processing.md** | Working with Sharp.js for poster composition |

**Tip:** You can reference a skill explicitly in your prompt:

```
"Help me create a Lambda handler following the patterns in .claude/skills/lambda-handler.md"
```

### Slash Commands

Commands are scaffolding tools you invoke directly. Type them in Claude Code to generate boilerplate.

| Command | What It Does |
|---------|--------------|
| `/new-image-function <name>` | Scaffolds an image processing function with tests |

**Example usage:**

```bash
# In Claude Code
/new-image-function createGradientBackground

# Claude will:
# 1. Ask clarifying questions about inputs/outputs
# 2. Create packages/core/src/image/create-gradient-background.ts
# 3. Create matching test file
# 4. Add export to barrel file
```

### When to Use What

| Scenario | What to Do |
|----------|------------|
| Starting a new Lambda endpoint | Just describe the endpoint—Claude will use the lambda-handler skill automatically |
| Need help with DynamoDB queries | Ask your question—Claude will apply dynamodb-operations patterns |
| Creating a new image function | Run `/new-image-function <name>` to scaffold, then fill in the TODOs |
| Unsure which skill applies | Just ask! Claude will figure it out from context |

## Common Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Check linting
pnpm type-check       # Check TypeScript

# LocalStack
pnpm localstack:up    # Start LocalStack
pnpm localstack:down  # Stop LocalStack
pnpm localstack:reset # Reset all data
pnpm localstack:logs  # View logs

# Specific apps
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

## Getting Help

1. **Check the docs:** `docs/` folder has guides for common scenarios
2. **Ask Claude Code:** It knows our codebase and patterns
3. **Search past PRs:** Similar features may have been implemented
4. **Ask the team:** We're here to help!

## Troubleshooting

### LocalStack won't start
```bash
# Check if ports are in use
lsof -i :4566
lsof -i :8001

# Reset Docker
docker-compose down -v
docker system prune -f
docker-compose up -d
```

### pnpm install fails
```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

### TypeScript errors in VS Code
```bash
# Restart TS server
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### AWS SDK can't connect to LocalStack
```bash
# Check your .env.local has:
USE_LOCALSTACK=true
DYNAMODB_ENDPOINT=http://localhost:4566

# Verify LocalStack is running
curl http://localhost:4566/_localstack/health
```

---

**You're all set!** 🎉 

Your first PR should be a small fix or feature from the backlog. Don't hesitate to ask questions - everyone was new once!
