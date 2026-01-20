# Backend API Implementation - Session Handoff

## Context

We're completing the backend API development for the BJJ Poster App. Five Linear tickets (ODE-194 to ODE-198) have been created, but the implementation plans need to follow proper TDD format and tickets need proper labeling/organization.

## What's Been Completed

✅ **Created 5 Linear tickets:**
- ODE-194: Generate Poster API Handler (Priority: Urgent)
- ODE-195: Get Templates API Handler (Priority: High)
- ODE-196: Get User Posters API Handler (Priority: High)
- ODE-197: User Profile API Handler (Priority: High)
- ODE-198: CDK Infrastructure Setup (Priority: Urgent)

✅ **Rewrote 2 plans in proper TDD format:**
- `docs/plans/2026-01-15-generate-poster-api-handler.md` ✓
- `docs/plans/2026-01-15-get-templates-api-handler.md` ✓

## What Needs to Be Done

### Task 1: Rewrite Remaining Plans (Use writing-plans Skill)

**CRITICAL**: Each plan MUST follow the `superpowers:writing-plans` skill format.

**Required Plan Structure:**
```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

## Task N: [Component Name]

### Step 1: Write failing test
[Complete test code]

### Step 2: Run test (expect FAIL)
```bash
[Exact command with expected output]
```

### Step 3: Implement minimal code
[Complete implementation]

### Step 4: Run test (expect PASS)
```bash
[Exact command with expected output]
```

### Step 5: Commit
```bash
git add [files]
git commit -m "feat: [message]"
```

---

## Execution Handoff

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - Dispatch subagent per task, review between tasks

**2. Parallel Session (separate)** - Open new session with executing-plans for batch execution

**Which approach?**
```

**Plans to Rewrite:**

1. **`docs/plans/2026-01-15-get-user-posters-api-handler.md`**
   - Reference the existing design doc (currently has architecture/design)
   - Add "For Claude" header
   - Break into bite-sized TDD tasks (2-5 min each)
   - Include: Repository methods (getUserPosters with pagination), Handler with cursor support
   - Each task: Write test → Run FAIL → Implement → Run PASS → Commit

2. **`docs/plans/2026-01-15-user-profile-api-handler.md`**
   - Reference the existing design doc (currently has full API spec)
   - Add "For Claude" header
   - Break into bite-sized TDD tasks
   - Include: Repository methods (getUser, updateLastActive), Handler with quota calculation
   - Each task: Write test → Run FAIL → Implement → Run PASS → Commit

3. **`docs/plans/2026-01-15-cdk-infrastructure-setup.md`**
   - Reference the existing design doc (currently has CDK stack design)
   - Add "For Claude" header
   - Break into bite-sized TDD tasks
   - Include: DatabaseStack, StorageStack, ApiStack with all Lambda functions
   - Each task: Write test → Run FAIL → Implement → Run PASS → Commit

**Reference Examples:**
- Use `docs/plans/2026-01-15-generate-poster-api-handler.md` as gold standard
- Use `docs/plans/2026-01-15-get-templates-api-handler.md` as simpler example

### Task 2: Create Parent Ticket

**Use Linear MCP to create parent ticket:**

```typescript
// Create parent issue
await mcp__linear__create_issue({
  title: "Backend API Development",
  team: "Onsight Digital",
  state: "In Progress",
  priority: 1, // Urgent
  description: `
# Backend API Development Epic

Complete backend infrastructure for BJJ Poster App including all Lambda handlers and AWS CDK deployment.

## Child Tickets
- ODE-194: Generate Poster API Handler
- ODE-195: Get Templates API Handler
- ODE-196: Get User Posters API Handler
- ODE-197: User Profile API Handler
- ODE-198: CDK Infrastructure Setup

## Architecture
- Lambda handlers with TypeScript
- DynamoDB single-table design
- S3 for poster storage
- API Gateway with JWT auth
- CDK for IaC

## Acceptance Criteria
- [ ] All 5 handlers implemented with TDD
- [ ] All tests passing (>80% coverage)
- [ ] CDK stacks deploy to dev environment
- [ ] All endpoints verified with LocalStack
- [ ] Integration tests complete
`,
  labels: ["backend", "epic", "api", "infrastructure"]
});
```

### Task 3: Update All 5 Tickets

**For EACH ticket (ODE-194 through ODE-198), use Linear MCP:**

```typescript
// Get current issue state (including existing labels and relations)
const issue = await mcp__linear__get_issue({
  id: "ODE-194",
  includeRelations: true
});

// Update with parent link and labels
await mcp__linear__update_issue({
  id: "ODE-194",
  parentId: "<PARENT_TICKET_ID>", // From Task 2
  labels: [...issue.labels, "pre-planned"], // Add to existing labels
});
```

**Update these tickets:**
1. ODE-194: Add "pre-planned" + parent link
2. ODE-195: Add "pre-planned" + parent link
3. ODE-196: Add "pre-planned" + parent link
4. ODE-197: Add "pre-planned" + parent link
5. ODE-198: Add "pre-planned" + parent link

**Verify each ticket has appropriate labels:**
- ODE-194: backend, api, lambda, pre-planned
- ODE-195: backend, api, lambda, pre-planned
- ODE-196: backend, api, lambda, pre-planned
- ODE-197: backend, api, lambda, pre-planned
- ODE-198: backend, infrastructure, cdk, aws, pre-planned

## Required Skills to Use

**CRITICAL**: You MUST invoke these skills:

1. **`superpowers:using-superpowers`** - Invoke FIRST to understand skill workflow
2. **`superpowers:writing-plans`** - Use when rewriting plans (Task 1)
3. **`TeamDev`** - Reference for understanding pre-planned workflow

**Workflow:**
```
Start Session
↓
Invoke: superpowers:using-superpowers
↓
Invoke: superpowers:writing-plans
↓
Task 1: Rewrite 3 plans following writing-plans format
↓
Task 2: Create parent ticket in Linear
↓
Task 3: Update all 5 tickets with labels + parent link
↓
Complete ✓
```

## Verification Checklist

Before marking complete, verify:

- [ ] All 5 plans have "For Claude: REQUIRED SUB-SKILL" header
- [ ] All 5 plans follow TDD format (Write test → Run FAIL → Implement → Run PASS → Commit)
- [ ] Parent ticket created in Linear with description
- [ ] All 5 child tickets link to parent ticket
- [ ] All 5 child tickets have "pre-planned" label
- [ ] All tickets have appropriate domain labels (backend/api/lambda/infrastructure)

## Commands Reference

```bash
# Read existing plan for reference
Read docs/plans/2026-01-15-get-user-posters-api-handler.md

# Write rewritten plan
Write docs/plans/2026-01-15-get-user-posters-api-handler.md

# List teams
mcp__linear__list_teams

# Create parent ticket
mcp__linear__create_issue

# Get ticket details
mcp__linear__get_issue({ id: "ODE-194", includeRelations: true })

# Update ticket
mcp__linear__update_issue({ id: "ODE-194", parentId: "...", labels: [...] })
```

## File Locations

- **Plans Directory**: `docs/plans/`
- **Reference Plans**:
  - `2026-01-15-generate-poster-api-handler.md` (gold standard)
  - `2026-01-15-get-templates-api-handler.md` (simpler example)
- **Plans to Rewrite**:
  - `2026-01-15-get-user-posters-api-handler.md`
  - `2026-01-15-user-profile-api-handler.md`
  - `2026-01-15-cdk-infrastructure-setup.md`

## Expected Outcome

When complete:
- 5 proper TDD implementation plans ready for execution
- 1 parent ticket organizing the backend epic
- 5 child tickets properly labeled and linked
- All tickets marked "pre-planned" for TeamDev workflow

## Start Command for Next Session

```
Please complete the backend API planning work:

1. Read docs/plans/HANDOFF-NEXT-SESSION.md for context
2. Invoke superpowers:using-superpowers skill
3. Invoke superpowers:writing-plans skill
4. Complete Task 1: Rewrite 3 remaining plans in TDD format
5. Complete Task 2: Create parent ticket in Linear
6. Complete Task 3: Update all 5 tickets with labels and parent link

Follow the skills exactly. Do not skip steps.
```
