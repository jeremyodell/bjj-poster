# Get Templates API Handler - Design

**Issue:** ODE-195
**Date:** 2026-01-18
**Status:** Approved

## Overview

Complete the Get Templates API handler by adding sorting, caching, tests, and a seeding script.

## Current State

- Handler exists at `apps/api/src/handlers/templates/list-templates.ts`
- Repository exists at `packages/db/src/repositories/template-repository.ts`
- Route registered at `GET /api/templates`
- Supports optional `?category=` filter

## Changes Required

### 1. Handler Updates

**Sorting:** Sort templates by category alphabetically after fetching:
```typescript
templates.sort((a, b) => a.category.localeCompare(b.category));
```

**Cache headers:** Add public caching for 5 minutes:
```typescript
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
}
```

### 2. Unit Tests

Create `apps/api/src/handlers/templates/__tests__/list-templates.test.ts`:

- Happy path - returns templates with correct structure
- Category filter - returns only matching templates
- Invalid category - returns 400 with error message
- Empty results - returns empty array
- Sorting - templates sorted by category alphabetically
- Cache headers - response includes correct Cache-Control header
- Error handling - returns 500 when database fails

Mock `@bjj-poster/db` to avoid real database calls.

### 3. Integration Tests

Create `apps/api/src/handlers/templates/__tests__/list-templates.integration.test.ts`:

- Uses LocalStack for real DynamoDB operations
- Seeds known template data
- Verifies category filtering works end-to-end
- Cleans up after tests

### 4. Template Seeding Script

Create `packages/db/src/scripts/seed-templates.ts`:

- Defines sample templates across all categories
- Uses `TemplateRepository.create()` method
- Idempotent (checks before inserting)
- Works with LocalStack

Add npm script: `"seed:templates": "tsx src/scripts/seed-templates.ts"`

## Design Decisions

- **Sorting:** Category alphabetically only (no popularity tracking). Simplest approach; popularity can be added later when usage data exists.
- **Caching:** Public cache allows CDN and browsers to cache. Templates are the same for all users, so this is efficient.

## Files to Create/Modify

| File | Action |
|------|--------|
| `apps/api/src/handlers/templates/list-templates.ts` | Modify |
| `apps/api/src/handlers/templates/__tests__/list-templates.test.ts` | Create |
| `apps/api/src/handlers/templates/__tests__/list-templates.integration.test.ts` | Create |
| `packages/db/src/scripts/seed-templates.ts` | Create |
| `packages/db/package.json` | Modify |
