# Generate Poster API Handler - Design

**Issue:** ODE-194
**Date:** 2026-01-16
**Status:** Approved

## Overview

Lambda handler for generating BJJ tournament posters from user input. Accepts multipart form data with photo upload, composes poster using `@bjj-poster/core`, stores in S3, and saves metadata to DynamoDB.

## API Contract

**Endpoint:** `POST /api/posters/generate`

**Request:**
- Content-Type: `multipart/form-data`
- Auth: Cognito JWT (userId from `event.requestContext.authorizer.claims.sub`)

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `photo` | File | Yes | Athlete photo (JPEG/PNG, max 10MB) |
| `templateId` | String | Yes | Template identifier (e.g., "classic") |
| `athleteName` | String | Yes | Athlete's name |
| `teamName` | String | No | Academy/team name |
| `beltRank` | String | Yes | white/blue/purple/brown/black |
| `tournamentName` | String | Yes | Tournament name |
| `tournamentDate` | String | Yes | Date string (e.g., "June 2025") |
| `tournamentLocation` | String | No | Location/city |
| `achievement` | String | No | e.g., "Gold Medal - Featherweight" |

**Success Response (201):**

```json
{
  "poster": {
    "id": "pstr_abc123",
    "templateId": "classic",
    "athleteName": "João Silva",
    "status": "completed",
    "imageUrl": "https://...",
    "thumbnailUrl": "https://...",
    "createdAt": "2026-01-16T15:30:00Z"
  },
  "usage": { "used": 1, "limit": 2, "remaining": 1 }
}
```

**Error Responses:**
- `400` - Invalid input / missing fields
- `401` - Unauthorized
- `403` - Quota exceeded
- `413` - Photo too large
- `500` - Generation failed

## Handler Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    POST /api/posters/generate                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 1. Extract userId   │
                   │    from JWT claims  │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 2. Check quota      │──── 403 Quota Exceeded
                   │    (before parsing) │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 3. Parse multipart  │──── 400 Invalid Format
                   │    form data        │──── 413 Photo Too Large
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 4. Validate fields  │──── 400 Validation Error
                   │    (Zod schema)     │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 5. composePoster()  │──── 500 Generation Failed
                   │    from @bjj-poster │
                   │    /core            │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 6. Generate         │
                   │    thumbnail (Sharp)│
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────────────────────┐
                   │ 7. Upload to S3 (parallel)          │
                   │    - posters/{userId}/{id}/original │
                   │    - posters/{userId}/{id}/thumb    │
                   │    - uploads/{userId}/{id}/photo    │
                   └─────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 8. Save to DynamoDB │
                   │    PK: USER#{userId}│
                   │    SK: POSTER#{ts}  │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 9. Increment user   │
                   │    usage count      │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ 10. Return 201      │
                   │     poster + usage  │
                   └─────────────────────┘
```

**Key Design Decisions:**
- Quota check happens **before** multipart parsing (fail fast)
- S3 uploads happen in **parallel** (poster, thumbnail, original photo)
- Usage increment happens **after** successful save (no orphan counts)
- Thumbnail generated inline (~50ms with Sharp)

## Data Model

### DynamoDB Poster Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | `USER#{userId}` |
| `SK` | String | `POSTER#{timestamp}#{posterId}` |
| `posterId` | String | `pstr_{nanoid(12)}` |
| `userId` | String | From JWT claims |
| `templateId` | String | e.g., "classic" |
| `status` | String | `completed` / `failed` |
| `athleteName` | String | |
| `teamName` | String | Optional |
| `beltRank` | String | white/blue/purple/brown/black |
| `tournamentName` | String | |
| `tournamentDate` | String | |
| `tournamentLocation` | String | Optional |
| `achievement` | String | Optional |
| `imageKey` | String | S3 key for full poster |
| `thumbnailKey` | String | S3 key for thumbnail |
| `uploadKey` | String | S3 key for original photo |
| `createdAt` | String | ISO 8601 |
| `updatedAt` | String | ISO 8601 |

### S3 Key Structure

```
posters/{userId}/{posterId}/original.jpg
posters/{userId}/{posterId}/thumbnail.jpg
uploads/{userId}/{posterId}/photo.jpg
```

### User Usage Tracking

Add to existing User entity:

| Attribute | Type | Description |
|-----------|------|-------------|
| `postersThisMonth` | Number | Current month's count |
| `usageResetAt` | String | ISO 8601 of next reset (1st of next month) |

**Usage Check Logic:**
1. Compare `usageResetAt` to now
2. If past reset date, reset count to 0 and update `usageResetAt`
3. Check count against tier limit (free: 2, pro: 20, premium: unlimited)

## Error Handling

| Scenario | Status | Code | Message |
|----------|--------|------|---------|
| No JWT / invalid token | 401 | `UNAUTHORIZED` | "Authentication required" |
| Quota exceeded | 403 | `QUOTA_EXCEEDED` | "Monthly poster limit reached" |
| Missing required field | 400 | `VALIDATION_ERROR` | "Field '{field}' is required" |
| Invalid belt rank | 400 | `VALIDATION_ERROR` | "Invalid belt rank" |
| No photo in request | 400 | `MISSING_PHOTO` | "Photo is required" |
| Invalid photo format | 400 | `INVALID_PHOTO` | "Photo must be JPEG or PNG" |
| Photo too large | 413 | `PHOTO_TOO_LARGE` | "Photo exceeds 10MB limit" |
| Template not found | 404 | `TEMPLATE_NOT_FOUND` | "Template '{id}' not found" |
| Image processing failed | 500 | `GENERATION_FAILED` | "Failed to generate poster" |
| S3 upload failed | 500 | `STORAGE_ERROR` | "Failed to save poster" |
| DynamoDB save failed | 500 | `DATABASE_ERROR` | "Failed to save poster metadata" |

**Quota Exceeded Response (403):**

```json
{
  "message": "Monthly poster limit reached",
  "code": "QUOTA_EXCEEDED",
  "usage": {
    "used": 2,
    "limit": 2,
    "remaining": 0,
    "resetsAt": "2026-02-01T00:00:00Z"
  }
}
```

**Rollback Strategy:**
- If S3 upload fails after generation → return error, don't save to DynamoDB
- If DynamoDB save fails after S3 upload → log orphaned S3 keys for cleanup (background job)
- Usage count only increments after successful DynamoDB save

## File Structure

**New/Modified Files:**

```
apps/api/src/
├── handlers/posters/
│   ├── generate-poster.ts      # Main handler (replace placeholder)
│   ├── generate-poster.test.ts # Unit tests
│   └── types.ts                # Zod schemas, interfaces
├── lib/
│   ├── multipart.ts            # Multipart parser utility
│   └── s3.ts                   # S3 upload helpers

packages/db/src/
├── repositories/
│   ├── poster-repository.ts    # Implement CRUD (currently stub)
│   └── user-repository.ts      # Add usage tracking methods
├── entities/
│   └── poster.ts               # Poster entity type
```

## Test Plan

### Unit Tests

| Test Case | Description |
|-----------|-------------|
| Auth | Returns 401 without JWT |
| Quota | Returns 403 when quota exceeded |
| Validation | Returns 400 for missing required fields |
| Validation | Returns 400 for invalid belt rank |
| Photo | Returns 400 when no photo provided |
| Photo | Returns 413 when photo > 10MB |
| Happy path | Returns 201 with poster object |
| Happy path | Uploads 3 files to S3 (poster, thumb, original) |
| Happy path | Saves poster to DynamoDB |
| Happy path | Increments usage count |
| Rollback | Doesn't increment usage on S3 failure |

### Integration Tests (LocalStack)

- Full end-to-end with real S3 + DynamoDB
- Verify S3 objects exist at expected keys
- Verify DynamoDB record matches response

## Technical Notes

- Lambda timeout: 30 seconds
- Memory: 2048 MB (for Sharp image processing)
- Uses `busboy` or `lambda-multipart-parser` for multipart parsing
- Thumbnail size: 400x560 (5:7 aspect ratio)
