# User Profile API Handler - Design

**Issue:** ODE-197
**Date:** 2026-01-19

## Overview

Implement `GET /api/user/profile` endpoint that returns authenticated user's profile data including subscription tier, quota information, and account details. This endpoint powers the frontend Zustand user store and quota displays.

## Response Structure

```typescript
interface GetProfileResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  subscription: {
    tier: 'free' | 'pro' | 'premium';
  };
  quota: {
    used: number;
    limit: number;        // -1 for unlimited
    remaining: number;    // -1 for unlimited
    resetsAt: string;     // ISO date string (first of next month)
  };
}
```

## Handler Flow

1. Extract `userId` from `event.requestContext.authorizer?.claims?.sub`
2. Return 401 if not authenticated
3. Fetch user profile via `db.users.getById(userId)`
4. Get usage via `db.users.getUsage(userId)`
5. Fire-and-forget `updateLastActiveAt` (non-blocking)
6. Return formatted response

## New User Handling

If user doesn't exist in DB yet (first login after Cognito signup), return default free tier profile:
- `tier: 'free'`
- `used: 0`
- `limit: 2`
- `remaining: 2`

The user record will be created on first poster generation.

## Database Changes

### User Entity

Add to `User` and `UserItem` interfaces:
```typescript
lastActiveAt?: string;
```

### UserRepository

Add method:
```typescript
async updateLastActiveAt(userId: string): Promise<void>
```

Simple UpdateCommand that sets `lastActiveAt` to current ISO timestamp.

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| No auth token | 401 | `{ message: "Unauthorized" }` |
| DB error | 500 | `{ message: "Failed to retrieve profile" }` |

## Testing

### Unit Tests
- Authenticated user returns profile
- Unauthenticated returns 401
- User not found returns default free tier
- DB error returns 500
- Calls updateLastActiveAt (fire-and-forget)

### Integration Tests
- Full flow with LocalStack
- Verifies lastActiveAt is updated in DB
