# CI/CD Pipeline Guide

**Version 1.0 | January 2025**

This guide explains our Continuous Integration and Continuous Deployment (CI/CD) pipeline for the BJJ Poster Builder application. It's designed to be educational for junior developers while serving as a reference for the entire team.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Branch Strategy](#branch-strategy)
3. [Workflow Files Explained](#workflow-files-explained)
4. [AWS Authentication Setup](#aws-authentication-setup)
5. [Deployment Process](#deployment-process)
6. [Rollback Strategy](#rollback-strategy)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Pipeline Overview

### What is CI/CD?

**Continuous Integration (CI):** Automatically testing and validating code changes whenever developers push commits or open pull requests. This catches bugs early, before they reach production.

**Continuous Deployment (CD):** Automatically deploying validated code to various environments (dev, staging, production) with minimal manual intervention.

### Our Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Workflow                                         │
├─────────────────────────────────────────────────────────────┤
│  1. Feature branch → Open PR                                │
│     ├─ Triggers (parallel):                                 │
│     │  ├─ ci.yml (lint, test, type-check, build)           │
│     │  ├─ claude-code-review.yml (AI code review)          │
│     │  └─ CDK diff preview (infrastructure changes)        │
│     │                                                        │
│     └─ ✅ All checks must pass before merge                │
│                                                             │
│  2. Merge PR to main                                        │
│     └─ Triggers: deploy-dev.yml                            │
│        ├─ Runs CDK diff                                     │
│        ├─ Deploys bjj-poster-dev stack automatically       │
│        └─ Runs smoke tests against dev environment         │
│                                                             │
│  3. Create git tag (v1.0.0)                                │
│     └─ Triggers: deploy-prod.yml                           │
│        ├─ Runs full test suite again                       │
│        ├─ Shows CDK diff for prod stack                    │
│        ├─ **Requires manual approval** 🛑                  │
│        ├─ Deploys bjj-poster-prod stack                    │
│        └─ Creates GitHub release with changelog            │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Fast Feedback:** Developers get CI results in 3-5 minutes. Issues are caught immediately, not hours later.

**Multiple Safety Gates:**
- AI code review catches potential issues
- CDK diff shows infrastructure changes
- Integration tests verify functionality
- Manual approval protects production

**Parallel Execution:** Jobs run concurrently to minimize wait time. Lint, test, and type-check don't wait for each other.

**Artifact Reuse:** We build once and deploy the same artifacts to dev and prod, ensuring consistency.

---

## Branch Strategy

We use a **two-tier branch strategy** optimized for small teams:

### Main Branch (`main`)

- **Purpose:** Stable, deployable code
- **Protection:** Requires PR approval + passing CI checks
- **Deploys to:** Dev environment (automatic)
- **When to merge:** After PR review and all checks pass

### Feature Branches

- **Naming:** `feat/TICKET-###`, `fix/bug-description`, `chore/task-name`
- **Purpose:** Isolated development of new features or fixes
- **Workflow:**
  1. Create branch from `main`
  2. Make changes and commit
  3. Open PR to `main`
  4. Address review comments
  5. Merge after approval

### Production Tags

- **Format:** `v1.0.0` (semantic versioning: major.minor.patch)
- **Purpose:** Mark production releases
- **Deploys to:** Production environment (requires manual approval)
- **When to create:** After verifying dev deployment works

**Example workflow:**

```bash
# Create feature branch
git checkout -b feat/IMG-005
git push -u origin feat/IMG-005

# Open PR, get it merged to main
# Dev deployment happens automatically

# Test in dev environment, then tag for production
git checkout main
git pull
git tag -a v1.0.0 -m "Release 1.0.0: Initial poster generation"
git push origin v1.0.0

# Go to GitHub Actions, approve production deployment
```

---

## Workflow Files Explained

### `.github/workflows/ci.yml` ✓ (Existing)

**Triggers:** Every pull request and push to `main`

**Purpose:** Ensures code quality and functionality before merge

**Jobs:**

1. **lint-and-typecheck** (runs in parallel with test)
   - Checks code style with ESLint
   - Verifies TypeScript types
   - **Why:** Catches syntax errors and type mismatches early
   - **Duration:** ~1-2 minutes

2. **test** (runs in parallel with lint-and-typecheck)
   - Runs unit tests with Vitest
   - **Why:** Validates business logic works correctly
   - **Duration:** ~1-2 minutes

3. **integration-test** (runs in parallel with above)
   - Spins up LocalStack container (simulates AWS services)
   - Runs integration tests against "fake AWS"
   - **Why:** Tests database operations, S3 uploads, etc. without AWS costs
   - **Duration:** ~2-3 minutes

4. **build** (runs after tests pass)
   - Builds all packages with Turborepo
   - Uploads artifacts for deployment
   - **Why:** Ensures code compiles and is ready to deploy
   - **Duration:** ~1 minute

**Key Features:**
- **Caching:** pnpm dependencies cached, speeds up reruns by ~40%
- **Parallelization:** Independent jobs run simultaneously
- **Fail Fast:** Stops immediately if any job fails

**Educational Note for Juniors:** This workflow embodies the "shift-left" principle—catching bugs early in development rather than in production. A failing CI check is good news; it means you caught an issue before users did!

---

### `.github/workflows/claude-code-review.yml` ✓ (Existing)

**Triggers:** Pull requests (opened, updated, reopened)

**Purpose:** AI-powered code review with project-specific context

**What it does:**
- Reviews only changed files (efficient)
- Posts inline comments on potential issues
- Posts summary comment on PR
- Focuses on: security, performance, error handling, testing, documentation

**Configuration:**
- **Confidence threshold:** 70% (only comments on high-confidence findings)
- **Custom instructions:** Knows about our Lambda patterns, DynamoDB design, error classes

**Why this matters:** Claude catches patterns humans might miss—like forgetting error handling, SQL injection risks, or inefficient database queries. It's like having a senior developer review every PR.

**Educational Note for Juniors:** Don't take AI feedback as gospel—it can be wrong. But treat it as a learning opportunity. If Claude suggests something, research why. You'll level up faster.

---

### `.github/workflows/deploy-dev.yml` 🆕 (New)

**Triggers:** Automatic on merge to `main` branch

**Purpose:** Deploy validated code to dev environment for testing

**Jobs:**

1. **deploy**
   - Authenticates with AWS using OIDC (temporary credentials)
   - Installs dependencies and builds all packages
   - Runs `cdk diff` to preview infrastructure changes
   - Deploys `bjj-poster-dev` CloudFormation stack
   - Extracts API URL from CDK outputs
   - Runs smoke tests (health checks)

**Why automatic deployment:** Dev is our testing ground. Fast deployment cycles let us iterate quickly without manual gates.

**What happens if deployment fails:**
- Workflow fails and stops
- CloudFormation rolls back automatically
- You get a GitHub notification
- Previous version stays deployed (safe)

**Smoke Tests:** Simple health checks to ensure the deployment succeeded:
```bash
# Example smoke test
curl -f https://api-dev.yourapp.com/health || exit 1
```

**Duration:** ~2-4 minutes

**Educational Note for Juniors:** The `cdk diff` step is crucial. It shows exactly what infrastructure will change (new Lambdas, DynamoDB table modifications, etc.). Always read this before deploying to understand the impact.

---

### `.github/workflows/deploy-prod.yml` 🆕 (New)

**Triggers:** Git tag push matching `v*.*.*` pattern (e.g., `v1.0.0`)

**Purpose:** Deploy to production with safety gates

**Jobs:**

1. **test** (runs first)
   - Re-runs full test suite
   - **Why:** Extra safety—ensures the tagged commit is actually stable
   - **Duration:** ~2 minutes

2. **deploy** (runs after tests pass)
   - Authenticates with AWS using OIDC
   - Builds all packages
   - Runs `cdk diff` for production stack
   - **PAUSES for manual approval** 🛑
   - Deploys `bjj-poster-prod` stack
   - Creates GitHub Release with auto-generated changelog
   - **Duration:** ~2-3 minutes (+ approval wait time)

**Manual Approval Gate:**
- Configured via GitHub Environment: `production`
- Requires 1+ team members to review and approve
- Approvers see CDK diff in workflow logs
- Can reject if changes look suspicious

**Why tag-based deployment:** Git tags create an immutable version history. You can always see exactly what code is in production and easily rollback by redeploying an older tag.

**Educational Note for Juniors:** Production deployments are scary at first. The manual approval step is your safety net. Review the CDK diff, check that dev deployment worked, then approve. With practice, this becomes routine.

---

## AWS Authentication Setup

We use **OpenID Connect (OIDC)** instead of storing AWS access keys in GitHub. This is more secure and follows AWS best practices.

### How OIDC Works

```
GitHub Actions → Requests temporary token → AWS STS
                                               ↓
                                     Validates GitHub identity
                                               ↓
                                   Issues 1-hour credentials
                                               ↓
GitHub Actions ← Receives temp credentials ←  AWS STS

Credentials automatically expire after 1 hour (no cleanup needed)
```

**Benefits:**
- **No long-lived credentials:** Nothing to leak or rotate
- **Automatic expiration:** Credentials are useless after 1 hour
- **Audit trail:** CloudTrail logs show which GitHub workflow made changes
- **Least privilege:** Different roles for dev and prod deployments

### One-Time Setup (Do This Once)

#### Step 1: Create OIDC Identity Provider in AWS

1. Go to **AWS Console → IAM → Identity Providers → Add Provider**
2. Choose **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Add Provider**

**Why:** This tells AWS to trust tokens issued by GitHub Actions.

#### Step 2: Create IAM Roles

Create two IAM roles: one for dev deployments, one for prod.

**Dev Deployment Role:**

1. Go to **IAM → Roles → Create Role**
2. Choose **Web Identity**
3. Identity Provider: `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Next**
6. Attach policies:
   - `AWSCloudFormationFullAccess` (CDK needs this)
   - `IAMFullAccess` (CDK creates Lambda execution roles)
   - Custom policy (see below)
7. Name: `GitHubActions-BjjPoster-Dev`

**Custom Policy for Dev Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "sqs:*",
        "logs:*",
        "cognito-idp:*",
        "ssm:GetParameter"
      ],
      "Resource": "*"
    }
  ]
}
```

**Edit the trust policy** to restrict to your repo:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/bjj-poster-app:*"
        }
      }
    }
  ]
}
```

**Prod Deployment Role:**

Repeat the same steps, but:
- Name: `GitHubActions-BjjPoster-Prod`
- Restrict trust policy to only `main` branch and tags:
  ```json
  "token.actions.githubusercontent.com:sub": [
    "repo:YOUR_ORG/bjj-poster-app:ref:refs/heads/main",
    "repo:YOUR_ORG/bjj-poster-app:ref:refs/tags/*"
  ]
  ```

**Why two roles:** Principle of least privilege. Dev role can only deploy dev stack, prod role can only deploy prod stack. If dev role is compromised, production is safe.

#### Step 3: Configure GitHub Secrets

Go to **GitHub Repo → Settings → Secrets and Variables → Actions**

Add these **Repository Secrets:**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID | `123456789012` |
| `AWS_REGION` | AWS region for deployments | `us-east-1` |
| `AWS_ROLE_ARN_DEV` | Dev IAM role ARN | `arn:aws:iam::123456789012:role/GitHubActions-BjjPoster-Dev` |
| `AWS_ROLE_ARN_PROD` | Prod IAM role ARN | `arn:aws:iam::123456789012:role/GitHubActions-BjjPoster-Prod` |

**Existing Secrets (already configured):**
- `ANTHROPIC_API_KEY` - Used by Claude Code Review workflow

#### Step 4: Create GitHub Environment Protection

1. Go to **GitHub Repo → Settings → Environments**
2. Click **New Environment**
3. Name: `production`
4. Check **Required reviewers**
5. Add at least 1 team member (not yourself, if possible)
6. Save

**Why:** The `deploy-prod.yml` workflow uses this environment, triggering the manual approval gate.

### Testing OIDC Authentication

After setup, test with this simple workflow:

```yaml
# .github/workflows/test-oidc.yml
name: Test OIDC
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Test AWS access
        run: aws sts get-caller-identity
```

Run this manually in GitHub Actions. If you see your account ID in the output, OIDC is working!

---

## Deployment Process

### Deploying to Dev (Automatic)

**Trigger:** Merge a PR to `main`

**What happens:**
1. PR must pass: CI checks + Claude review + manual approval
2. After merge, `deploy-dev.yml` triggers automatically
3. Workflow runs CDK diff (you can see this in Actions tab)
4. CDK deploys changes to `bjj-poster-dev` stack
5. Smoke tests verify deployment succeeded
6. You receive GitHub notification (success or failure)

**Timeline:**
```
PR merged → 30s (workflow starts) → 2-4min (deployment) → Dev is live
```

**What to check after deployment:**
- GitHub Actions shows green checkmark
- Test API manually: `curl https://api-dev.yourapp.com/health`
- Check CloudWatch logs if something seems off

### Deploying to Production (Manual)

**Trigger:** Push a git tag

**Step-by-step process:**

1. **Verify dev deployment works**
   ```bash
   # Test key functionality in dev
   curl https://api-dev.yourapp.com/api/user/profile
   # Upload a test photo, generate a poster, etc.
   ```

2. **Create and push git tag**
   ```bash
   git checkout main
   git pull  # Ensure you have latest

   # Create annotated tag (required for changelogs)
   git tag -a v1.0.0 -m "Release 1.0.0: Initial poster generation MVP"

   # Push tag (triggers deploy-prod.yml)
   git push origin v1.0.0
   ```

3. **Monitor workflow in GitHub Actions**
   - Go to **Actions → Deploy to Production**
   - Watch test suite run
   - Review CDK diff output

4. **Approve deployment**
   - Workflow pauses at "Review Deployment" step
   - Click **Review deployments**
   - Review changes one last time
   - Click **Approve and deploy**

5. **Verify production deployment**
   ```bash
   # Check health
   curl https://api.yourapp.com/health

   # Check CloudFormation stack
   aws cloudformation describe-stacks \
     --stack-name bjj-poster-prod \
     --query 'Stacks[0].StackStatus'
   ```

**Timeline:**
```
Tag pushed → Test suite (2min) → CDK diff → Manual approval (your time)
→ Deployment (2-3min) → GitHub Release created → Prod is live
```

### Understanding CDK Diff Output

When you see CDK diff output, here's how to read it:

```diff
Stack: bjj-poster-dev

Resources
[+] AWS::Lambda::Function CreatePosterFunction
    └─ New Lambda function will be created

[~] AWS::DynamoDB::Table PosterTable
 └─ [~] BillingMode
     └─ PROVISIONED → PAY_PER_REQUEST
     (Changing billing mode - no downtime)

[-] AWS::S3::Bucket OldUploadBucket
    └─ Bucket will be DELETED (⚠️ data loss risk)

Parameters
[~] Parameter ApiDomainName
 └─ api-dev.old.com → api-dev.new.com
```

**Symbols:**
- `[+]` Resource will be created
- `[~]` Resource will be modified (usually safe)
- `[-]` Resource will be deleted (⚠️ review carefully)

**Red flags to watch for:**
- Deleting DynamoDB tables (data loss!)
- Deleting S3 buckets (data loss!)
- Changing Lambda function names (triggers recreation)
- Changing API Gateway IDs (breaks existing URLs)

If you see something scary, **reject the deployment** and investigate why CDK wants to make that change.

---

## Rollback Strategy

Deployments can fail or cause issues. Here's how to roll back safely.

### Scenario 1: Deployment Failed (CloudFormation Rollback)

**What happened:** CDK deployment failed mid-process

**What CloudFormation does automatically:**
- Detects the failure
- Rolls back to previous state
- Previous version stays deployed
- No user impact

**What you do:**
1. Check GitHub Actions logs for error
2. Check CloudFormation console for details
3. Fix the issue in code
4. Try deploying again

**Example error:**
```
Error: Lambda function CreatePoster has invalid runtime nodejs18.x
```

**Fix:** Update CDK code to use `nodejs20.x`, commit, push, wait for deployment.

### Scenario 2: Deployment Succeeded but Introduced a Bug

**What happened:** Code deployed successfully but users are experiencing issues

**Option A: Revert via Git (Recommended)**

```bash
# 1. Find the bad commit
git log --oneline

# 2. Revert it (creates new commit that undoes changes)
git revert <bad-commit-hash>

# 3. Push to main (triggers deploy-dev)
git push origin main

# 4. Verify in dev, then tag for prod
git tag -a v1.0.1-hotfix -m "Revert bad deployment"
git push origin v1.0.1-hotfix
```

**Why this is best:** Creates audit trail, preserves git history, goes through same deployment process.

**Option B: Redeploy Previous Tag**

```bash
# Find last known good tag
git tag --sort=-creatordate | head -n 5

# Create new tag from old commit
git checkout v1.0.0  # Last known good version
git tag -a v1.0.1-rollback -m "Rollback to v1.0.0"
git push origin v1.0.1-rollback

# Approve deployment in GitHub Actions
```

**Why use this:** Fastest rollback when you need to revert immediately.

**Option C: Manual CDK Rollback (Emergency)**

If GitHub Actions is down or you need to rollback immediately:

```bash
# 1. Checkout last known good version
git checkout v1.0.0

# 2. Deploy directly from your machine
cd infra
pnpm install
pnpm cdk deploy --all \
  --context stage=prod \
  --profile your-aws-profile

# 3. Document what you did (create issue, update team)
```

**⚠️ Warning:** This bypasses CI/CD. Only use in emergencies.

### Scenario 3: Database Migration Failed

**What happened:** CDK tried to modify DynamoDB table and failed

**What to do:**
1. **Don't panic.** CloudFormation keeps old table intact
2. Check CloudFormation console → Events tab
3. Common issues:
   - Trying to change primary key (not allowed)
   - Trying to delete GSI with data (need to remove manually first)
   - Billing mode conflicts

**Fix:**
```bash
# For GSI removal, manually delete first:
aws dynamodb update-table \
  --table-name bjj-poster-dev \
  --global-secondary-index-updates \
    '[{"Delete":{"IndexName":"OldIndexName"}}]'

# Wait for deletion to complete (check console)

# Then retry CDK deployment
cd infra
pnpm cdk deploy --context stage=dev
```

### Rollback Checklist

Before rolling back, ask yourself:

- [ ] What exactly is broken? (Specific error or behavior)
- [ ] Is this affecting all users or just some?
- [ ] Can we hotfix forward instead of rolling back?
- [ ] Do we have a known good version to roll back to?
- [ ] Will rollback cause data loss? (Check database schema changes)
- [ ] Have we notified the team?

**Principle:** Prefer rolling forward (fix + deploy) over rolling back when possible. Rollbacks can be risky if database schemas changed.

---

## Troubleshooting

### Common Issues

#### "Error: No such file or directory: 'infra/cdk.out'"

**Cause:** CDK hasn't synthesized CloudFormation templates yet

**Fix:**
```bash
cd infra
pnpm build  # Compiles TypeScript CDK code
pnpm cdk synth  # Generates CloudFormation templates
```

#### "Error: Credentials could not be loaded"

**Cause:** OIDC not configured correctly or missing permissions

**Debug steps:**
1. Check GitHub Secrets are set correctly
2. Verify IAM role trust policy includes your repo
3. Check workflow has `permissions: id-token: write`
4. Test with `aws sts get-caller-identity` in workflow

#### "Error: Stack bjj-poster-dev is in UPDATE_ROLLBACK_COMPLETE state"

**Cause:** Previous deployment failed and rolled back, stack is in bad state

**Fix:**
```bash
# Continue update to get stack back to stable state
aws cloudformation continue-update-rollback \
  --stack-name bjj-poster-dev
```

#### "LocalStack tests fail in CI but work locally"

**Cause:** Race condition - tests run before LocalStack is fully ready

**Fix:** Add retry logic or increase health check timeout in `ci.yml`:
```yaml
options: >-
  --health-retries 10  # Increase from 5 to 10
  --health-interval 10s
```

#### "Build artifacts not found in deploy workflow"

**Cause:** Deploy workflow isn't downloading artifacts from CI workflow

**Fix:** Ensure workflows run on same commit:
```yaml
# In deploy-dev.yml, use the commit that triggered the workflow
- name: Download artifacts
  uses: actions/download-artifact@v4
  with:
    name: build-artifacts
    run-id: ${{ github.event.workflow_run.id }}
```

### Getting Help

**Where to look:**
1. GitHub Actions logs (click failed step for details)
2. CloudFormation console → Events tab (shows AWS errors)
3. CloudWatch Logs (Lambda errors, API Gateway logs)
4. LocalStack logs: `docker-compose logs -f localstack`

**How to ask for help:**
1. Share workflow run URL
2. Copy error message from logs
3. Describe what you were trying to do
4. Share relevant code changes (PR link)

**Example good question:**
> "Deploy to dev failed with error 'Resource handler returned message: Invalid permissions on Lambda function'. Here's the workflow run: [link]. I added a new Lambda in PR #123. The CDK diff showed it was creating a new function. Any ideas?"

---

## Best Practices

### For All Developers

**1. Always read CDK diff before approving deployments**
   - Don't click "approve" blindly
   - If you see `[-]` deletions, understand why
   - Ask questions if something looks wrong

**2. Test in dev before tagging for production**
   - Minimum: Call key API endpoints
   - Better: Run through full user flow
   - Best: Automated smoke tests

**3. Use semantic versioning for tags**
   - `v1.0.0` - Major release (breaking changes)
   - `v1.1.0` - Minor release (new features, backwards compatible)
   - `v1.1.1` - Patch release (bug fixes)

**4. Write meaningful git messages**
   ```bash
   # Bad
   git commit -m "fix"

   # Good
   git commit -m "fix(api): handle null user profile in getPoster endpoint"
   ```

**5. Keep PRs small and focused**
   - Easier to review
   - Faster to merge
   - Easier to rollback if needed
   - Target: < 400 lines changed per PR

### For Junior Developers

**1. Don't fear failed deployments**
   - CloudFormation rolls back automatically
   - You can't break production (manual approval protects it)
   - Failed deployments are learning opportunities

**2. Read workflow logs when things fail**
   - Click into the failed step
   - Read error messages carefully
   - Google unfamiliar error messages
   - Ask for help with specific error context

**3. Use dev environment liberally**
   - Deploy often to dev
   - Experiment with infrastructure changes
   - Break things and learn how to fix them

**4. Learn from Claude Code Review feedback**
   - Don't just fix the issue—understand why it's an issue
   - Research suggested improvements
   - Apply learnings to future PRs

### For Reviewers

**1. Review CDK changes carefully**
   - Infrastructure changes are harder to rollback
   - Check for resource deletions
   - Verify IAM permissions follow least privilege

**2. Verify tests cover new functionality**
   - New features should have tests
   - Bug fixes should have regression tests
   - Integration tests for database changes

**3. Consider operational impact**
   - Will this increase API latency?
   - Will this increase AWS costs?
   - Will this require database migration?

### Security Best Practices

**1. Never commit secrets**
   - No API keys in code
   - No hardcoded passwords
   - Use GitHub Secrets or AWS Secrets Manager

**2. Review IAM role permissions quarterly**
   - Remove unused permissions
   - Apply least privilege
   - Audit CloudTrail logs

**3. Rotate credentials regularly**
   - Although OIDC credentials auto-expire
   - Rotate any long-lived keys (if you have them)
   - Review GitHub Secret access

**4. Enable branch protection**
   - Require PR reviews
   - Require status checks to pass
   - Prevent direct pushes to `main`

---

## Appendix: Workflow Reference

### Quick Command Reference

```bash
# Local development
pnpm dev              # Start dev servers
pnpm test             # Run tests
pnpm lint             # Check code style
pnpm build            # Build all packages

# Deployments (via GitHub Actions)
# Dev: Merge PR to main
# Prod: Push tag

# Manual CDK operations (emergency only)
cd infra
pnpm cdk diff --context stage=dev    # Preview changes
pnpm cdk deploy --context stage=dev  # Deploy
pnpm cdk destroy --context stage=dev # Delete stack
```

### Environment URLs

| Environment | API URL | DynamoDB Table | S3 Buckets |
|-------------|---------|----------------|------------|
| **Dev** | `https://api-dev.yourapp.com` | `bjj-poster-dev` | `bjj-poster-uploads-dev` |
| **Prod** | `https://api.yourapp.com` | `bjj-poster-prod` | `bjj-poster-uploads-prod` |

### Useful GitHub Actions Queries

Find failed deployments:
```
is:failure is:completed workflow:"Deploy to Production"
```

Find deployments by version:
```
is:completed workflow:"Deploy to Production" v1.0.0
```

---

## Next Steps

After setting up CI/CD:

1. **Configure OIDC** following [AWS Authentication Setup](#aws-authentication-setup)
2. **Set GitHub Secrets** as listed in Step 3
3. **Create production environment** with required reviewers
4. **Test with a small PR** to verify CI works
5. **Deploy to dev** by merging a PR
6. **Review deployment process** with the team
7. **Do a test prod deployment** with v0.1.0 tag

---

**Questions or issues?** Open a GitHub issue or ask in team Slack.

**Contributing to this guide?** PRs welcome! Help us make it clearer for future team members.
