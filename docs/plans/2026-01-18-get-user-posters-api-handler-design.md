# Get User Posters API Handler - Design

**Issue:** ODE-196
**Date:** 2026-01-18
**Status:** Approved

## Overview

Implement Lambda handler for fetching a user's poster history with cursor-based pagination and optional belt rank filtering. Powers the dashboard poster grid with TanStack Query infinite scroll.

## API Contract

**Endpoint:** `GET /api/posters`

### Query Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Items per page (max: 50) |
| `cursor` | string | No | - | Base64-encoded cursor for next page |
| `beltRank` | string | No | - | Filter: white/blue/purple/brown/black |

### Success Response (200)

```json
{
  "posters": [
    {
      "id": "abc123",
      "templateId": "tmpl_001",
      "athleteName": "John Silva",
      "teamName": "Alliance",
      "beltRank": "purple",
      "tournamentName": "IBJJF Worlds 2026",
      "tournamentDate": "June 2026",
      "tournamentLocation": "Las Vegas, NV",
      "achievement": "Gold Medal",
      "status": "completed",
      "imageUrl": "https://cdn.../posters/abc123.png",
      "thumbnailUrl": "https://cdn.../thumbnails/abc123.png",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "UE9TVEVSIzIwMjYt...",
    "hasMore": true
  },
  "count": 20
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid query parameters (bad limit, invalid beltRank) |
| 401 | Missing or invalid authentication |
| 500 | Internal server error |

## Repository Changes

### New Method: `getByUserIdPaginated`

```typescript
interface PaginatedPostersOptions {
  limit?: number;
  cursor?: string;  // Base64-encoded SK
  beltRank?: BeltRank;
}

interface PaginatedPostersResult {
  items: Poster[];
  nextCursor: string | null;
}

async getByUserIdPaginated(
  userId: string,
  options: PaginatedPostersOptions = {}
): Promise<PaginatedPostersResult>
```

### Implementation Details

1. **Cursor encoding:** Base64-encoded DynamoDB SK (`POSTER#<timestamp>#<posterId>`)
2. **Pagination detection:** Fetch `limit + 1` items to detect hasMore without extra query
3. **Filtering:** DynamoDB `FilterExpression` for belt rank (post-key-condition filter)
4. **Sorting:** `ScanIndexForward: false` for newest-first (matches SK natural order)

### Why New Method

The existing `getByUserId(userId, limit)` remains unchanged for simple use cases (e.g., monthly poster count). The new paginated method provides cursor support without breaking existing callers.

## Handler Implementation

**File:** `apps/api/src/handlers/posters/get-user-posters.ts`

### Flow

1. Extract `userId` from `event.requestContext.authorizer?.claims?.sub`
2. Return 401 if not authenticated
3. Parse and validate query parameters
4. Call `db.posters.getByUserIdPaginated(userId, options)`
5. Transform results: add signed URLs for imageKey/thumbnailKey
6. Return formatted response with pagination metadata

### Validation Rules

| Parameter | Validation |
|-----------|------------|
| `limit` | Integer, 1-50, defaults to 20 |
| `cursor` | String, validated on decode (invalid = 400) |
| `beltRank` | Enum: white, blue, purple, brown, black |

## Files Changed

| File | Change |
|------|--------|
| `packages/db/src/repositories/poster-repository.ts` | Add `getByUserIdPaginated()` |
| `packages/db/src/entities/poster.ts` | Add pagination types |
| `packages/db/src/index.ts` | Export new types |
| `apps/api/src/handlers/posters/get-user-posters.ts` | Full implementation |
| `apps/api/src/handlers/posters/types.ts` | Add response types |

## Testing Strategy

### Unit Tests

| Test Case | Description |
|-----------|-------------|
| Returns 401 when no auth | Missing authorizer claims |
| Returns posters for authenticated user | Happy path |
| Respects limit parameter | Passes limit to repository |
| Validates limit bounds | Rejects < 1 or > 50 |
| Passes cursor to repository | Cursor forwarding |
| Filters by belt rank | Belt rank passed correctly |
| Rejects invalid belt rank | Returns 400 |
| Returns empty array when no posters | Empty state |
| Handles pagination correctly | nextCursor/hasMore logic |
| Returns 500 on repository error | Error handling |

### Integration Tests

| Test Case | Description |
|-----------|-------------|
| Full pagination flow | Seed 5 posters, paginate with limit=2 |
| Belt rank filter works | Mixed ranks, filter returns subset |
| User isolation | User A cannot see User B's posters |
| Cursor continuity | Cursor from page 1 works on page 2 |

## Out of Scope

- GSI for belt rank queries (not needed at current scale)
- Response caching (can add later)
- Alternative sort orders (newest-first matches SK order)
- Bulk delete/update operations
