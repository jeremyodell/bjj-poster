# CI/CD Pipeline Tickets - Session Handoff

## Context

We've just completed the Backend API Development planning phase:
- ✅ Created 5 backend API handler tickets (ODE-194 to ODE-198)
- ✅ Rewrote all implementation plans in proper TDD format
- ✅ Created parent epic ticket ODE-199
- ✅ All tickets labeled with "pre-planned" for TeamDev workflow

**Next priority:** Create CI/CD Pipeline Configuration tickets

## Objective

Create Linear tickets for CI/CD pipeline setup. These tickets will be worked on by a junior developer with guidance, so they need to be:
1. **Beginner-friendly** - Clear acceptance criteria, no assumed knowledge
2. **Well-documented** - Link to relevant docs and examples
3. **Bite-sized** - Small, focused tasks that build on each other
4. **Safe** - No risky operations without explicit approval steps

## Required Tickets

### Epic: CI/CD Pipeline Configuration (Parent Ticket)

Create parent ticket first, then child tickets below.

**Parent Ticket:**
- Title: "CI/CD Pipeline Configuration"
- Priority: High
- State: Backlog
- Labels: infrastructure, ci-cd, deployment, epic
- Description: Complete CI/CD setup for automated deployment to AWS dev and production environments

---

### Ticket 1: GitHub Actions Dev Environment Secrets Setup

**Title:** Configure GitHub Secrets for Dev Environment

**Priority:** High (blocks deployment)

**Description:**
Set up all required GitHub Actions secrets for automated deployment to the dev environment.

**Acceptance Criteria:**
- [ ] AWS_ACCESS_KEY_ID added to GitHub secrets
- [ ] AWS_SECRET_ACCESS_KEY added to GitHub secrets
- [ ] AWS_REGION set to us-east-1
- [ ] STRIPE_SECRET_KEY_DEV added for dev environment
- [ ] All secrets validated by running test workflow
- [ ] Documentation updated with secret names and purposes

**Technical Notes:**
- Secrets are added in GitHub repo Settings → Secrets and variables → Actions
- Never commit secrets to git
- Use least-privilege IAM user for deployment
- Secrets are available in workflows via `${{ secrets.SECRET_NAME }}`

**Resources:**
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- AWS IAM best practices
- Stripe API key management

**Dependencies:**
- Requires AWS account access
- Requires Stripe account access

---

### Ticket 2: Dev Deployment Workflow

**Title:** Create GitHub Actions Workflow for Dev Deployment

**Priority:** High

**Description:**
Create automated workflow that deploys to dev environment on every push to main branch.

**Acceptance Criteria:**
- [ ] Workflow file created at `.github/workflows/deploy-dev.yml`
- [ ] Triggers on push to main branch
- [ ] Runs tests before deployment
- [ ] Builds all packages (pnpm build)
- [ ] Runs CDK synth to validate stacks
- [ ] Deploys CDK stacks to dev environment
- [ ] Posts deployment status to PR/commit
- [ ] Fails fast if tests fail (doesn't deploy broken code)
- [ ] Takes less than 10 minutes to complete

**Workflow Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (pnpm install)
4. Run linting (pnpm lint)
5. Run tests (pnpm test)
6. Build packages (pnpm build)
7. Configure AWS credentials
8. CDK synth (validate stacks)
9. CDK deploy --all --context stage=dev
10. Output deployment URL

**Technical Notes:**
- Use `pnpm/action-setup@v2` for pnpm support
- Use `aws-actions/configure-aws-credentials@v4` for AWS setup
- Fail on any step error (set `fail-fast: true`)
- Cache node_modules for faster builds
- Use concurrency to cancel in-progress deployments

**Example Workflow Structure:**
```yaml
name: Deploy to Dev

on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      # ... rest of steps
```

**Dependencies:**
- Ticket 1 (secrets) must be complete
- CDK stacks must exist (ODE-198)

---

### Ticket 3: Prod Environment Secrets Setup

**Title:** Configure GitHub Secrets for Production Environment

**Priority:** High

**Description:**
Set up all required GitHub Actions secrets for production deployment with proper security controls.

**Acceptance Criteria:**
- [ ] AWS_ACCESS_KEY_ID_PROD added to GitHub secrets
- [ ] AWS_SECRET_ACCESS_KEY_PROD added to GitHub secrets
- [ ] STRIPE_SECRET_KEY_PROD added
- [ ] STRIPE_WEBHOOK_SECRET_PROD added
- [ ] Production secrets use different AWS account or strict IAM policies
- [ ] All secrets validated
- [ ] Documentation updated

**Technical Notes:**
- Production secrets should be separate from dev
- Consider using OIDC instead of long-lived credentials
- Enable branch protection rules for main branch
- Require approvals for production deployments

**Security Requirements:**
- Production AWS credentials must have minimal permissions
- Use separate IAM user/role for prod deployments
- Enable MFA for AWS account
- Rotate secrets every 90 days

**Dependencies:**
- Ticket 1 complete (for reference)

---

### Ticket 4: Prod Deployment Workflow with Manual Approval

**Title:** Create GitHub Actions Workflow for Production Deployment

**Priority:** High

**Description:**
Create production deployment workflow with manual approval gate to prevent accidental deployments.

**Acceptance Criteria:**
- [ ] Workflow file created at `.github/workflows/deploy-prod.yml`
- [ ] Triggers manually via workflow_dispatch OR on git tags (v*)
- [ ] Runs full test suite (unit + integration)
- [ ] Requires manual approval before deployment
- [ ] Deploys to production only after approval
- [ ] Sends deployment notification (Slack/email)
- [ ] Creates GitHub release notes
- [ ] Rolls back automatically on deployment failure

**Workflow Features:**
1. **Manual Trigger** - Only runs when explicitly triggered
2. **Approval Gate** - Requires team member approval
3. **Full Test Suite** - Runs all tests including integration
4. **Smoke Tests** - Validates deployment after completion
5. **Rollback** - Automatic rollback on failure
6. **Notifications** - Posts to Slack/Discord on success/failure

**Approval Gate Example:**
```yaml
jobs:
  approval:
    runs-on: ubuntu-latest
    environment: production  # Requires approval in GitHub
    steps:
      - name: Wait for approval
        run: echo "Deployment approved"

  deploy:
    needs: approval
    runs-on: ubuntu-latest
    # ... deployment steps
```

**Technical Notes:**
- Use GitHub Environments feature for approval
- Set up protected environment in repo settings
- Configure required reviewers (at least 1)
- Add smoke tests after deployment
- Store deployment artifacts for rollback

**Dependencies:**
- Ticket 2 (dev workflow) as template
- Ticket 3 (prod secrets) must be complete

---

### Ticket 5: Deployment Status Notifications

**Title:** Add Slack/Discord Notifications for Deployments

**Priority:** Medium

**Description:**
Add automated notifications to team communication channels when deployments succeed or fail.

**Acceptance Criteria:**
- [ ] Slack webhook URL added to GitHub secrets
- [ ] Success notification sent when dev deployment completes
- [ ] Failure notification sent when deployment fails
- [ ] Notifications include deployment details (environment, commit, user)
- [ ] Notifications include links to GitHub Actions run
- [ ] Prod deployments send enhanced notifications
- [ ] Works for both dev and prod workflows

**Notification Content:**
- ✅ Success: "🚀 Deployed to [ENV] by @user | Commit: abc123 | Duration: 5m"
- ❌ Failure: "🚨 Deployment to [ENV] failed | Commit: abc123 | Logs: [link]"

**Technical Notes:**
- Use Slack Incoming Webhooks or Discord webhooks
- Add notification step at end of workflow
- Use `if: always()` to ensure notifications run
- Include relevant context (environment, commit, duration)

**Example Slack Notification:**
```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment ${{ job.status }}",
        "blocks": [...]
      }
```

**Dependencies:**
- Ticket 2 or 4 complete (workflows exist)
- Slack/Discord webhook configured

---

### Ticket 6: Cost Monitoring & Budget Alerts

**Title:** Set Up AWS Cost Monitoring and Budget Alerts

**Priority:** Medium

**Description:**
Configure AWS Budgets and CloudWatch alarms to monitor costs and prevent unexpected charges.

**Acceptance Criteria:**
- [ ] AWS Budget created for dev environment ($50/month)
- [ ] AWS Budget created for prod environment ($200/month)
- [ ] Email alerts at 80% and 100% of budget
- [ ] CloudWatch dashboard shows cost by service
- [ ] Weekly cost report sent to team
- [ ] Documentation on cost optimization strategies

**Budget Alerts:**
- Dev: Alert at $40 (80%) and $50 (100%)
- Prod: Alert at $160 (80%) and $200 (100%)

**Technical Notes:**
- Set up in AWS Billing console
- Use Cost Explorer for detailed analysis
- Tag resources with Environment tag
- Monitor Lambda, DynamoDB, S3, API Gateway costs

**Cost Optimization Tips:**
- Use PAY_PER_REQUEST for DynamoDB
- Set Lambda timeout appropriately
- Enable S3 lifecycle policies
- Use CloudFront caching

**Dependencies:**
- AWS account access with billing permissions

---

### Ticket 7: Rollback & Recovery Procedures

**Title:** Document and Test Deployment Rollback Procedures

**Priority:** Medium

**Description:**
Create documentation and test procedures for rolling back failed deployments.

**Acceptance Criteria:**
- [ ] Rollback documentation created in `docs/deployment/`
- [ ] Step-by-step rollback guide for dev environment
- [ ] Step-by-step rollback guide for prod environment
- [ ] Tested rollback procedure in dev environment
- [ ] Runbook for common deployment failures
- [ ] Emergency contact list for deployment issues

**Rollback Scenarios:**
1. Database migration failure
2. Lambda function error spike
3. API Gateway 5xx errors
4. S3 permission issues

**Rollback Methods:**
- CDK: Deploy previous stack version
- Lambda: Revert to previous function version
- API Gateway: Revert to previous stage deployment

**Documentation Sections:**
1. When to rollback (decision criteria)
2. How to rollback (step-by-step)
3. Post-rollback validation
4. Root cause analysis template

**Dependencies:**
- Ticket 2 and 4 complete (deployments working)

---

## Implementation Order

**Phase 1: Dev Pipeline (1-2 days)**
1. Ticket 1: Dev secrets setup
2. Ticket 2: Dev deployment workflow
3. Test dev deployment works end-to-end

**Phase 2: Prod Pipeline (2-3 days)**
4. Ticket 3: Prod secrets setup
5. Ticket 4: Prod deployment workflow
6. Test prod deployment with approval gate

**Phase 3: Monitoring & Safety (1-2 days)**
7. Ticket 5: Deployment notifications
8. Ticket 6: Cost monitoring
9. Ticket 7: Rollback procedures

**Total Estimated Time:** 4-7 days for junior developer with guidance

---

## Safety Guidelines for Junior Developer

### Before Making Changes:
1. **Always work in a branch** - Never push directly to main
2. **Test locally first** - Validate workflows with `act` or similar tools
3. **Start with dev environment** - Never touch prod until dev works perfectly
4. **Ask before adding secrets** - Get approval before adding any credentials
5. **Review security implications** - Understand what permissions you're granting

### When Working with Secrets:
- Never commit secrets to git (check with `git diff` before commit)
- Never log secrets in workflow output
- Use minimal IAM permissions
- Rotate secrets if accidentally exposed

### When Writing Workflows:
- Start with simple workflow and add complexity gradually
- Use `dry-run` mode for CDK when testing
- Add plenty of echo statements for debugging
- Test failure scenarios (what happens when tests fail?)

### Getting Help:
- Read GitHub Actions documentation
- Check existing workflows in other repos
- Ask questions before proceeding if uncertain
- Pair program for security-sensitive changes

---

## Success Criteria

When all tickets are complete, we should have:
- ✅ Automated deployment to dev on every main branch push
- ✅ Manual deployment to prod with approval gate
- ✅ Deployment notifications in Slack/Discord
- ✅ Cost monitoring with budget alerts
- ✅ Documented rollback procedures
- ✅ Full test suite running before deployment
- ✅ Zero manual steps for deployment (except prod approval)

---

## Instructions for Next Session

1. **Invoke superpowers:using-superpowers skill first**
2. **Invoke superpowers:writing-plans skill** (for any needed implementation plans)
3. Create parent epic ticket in Linear: "CI/CD Pipeline Configuration"
4. Create 7 child tickets (detailed above)
5. Link all child tickets to parent
6. Add labels: infrastructure, ci-cd, deployment, junior-friendly
7. Assign appropriate priorities
8. Link tickets to BJJ Poster APP project

**Use Linear MCP tools to create tickets efficiently.**

---

**Ready to start?**

Copy this prompt to begin the next session:

```
Please create CI/CD pipeline tickets for the BJJ Poster App:

1. Read docs/plans/HANDOFF-CI-CD-TICKETS.md for full context
2. Invoke superpowers:using-superpowers skill
3. Create parent epic ticket: "CI/CD Pipeline Configuration"
4. Create 7 child tickets as detailed in the handoff document
5. Make tickets junior-developer-friendly with clear acceptance criteria
6. Link all tickets to parent and add appropriate labels

These tickets are for a junior developer to work on with guidance, so be extra clear and detailed.
```
