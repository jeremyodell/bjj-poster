# ADR-001: Poster Status Updates - Polling vs WebSocket

**Status:** Accepted
**Date:** 2025-01-05
**Decision Makers:** Technical Lead, Team
**Stakeholders:** Frontend developers, Backend developers, End users

---

## Context

When a user generates a poster, the processing happens asynchronously via SQS → Lambda → Bedrock. Processing can take 10-30 seconds depending on Bedrock response times and image composition complexity.

The frontend needs to notify users when their poster is ready. We have two primary options:

### Option 1: HTTP Polling
```typescript
// Frontend repeatedly calls GET /api/posters/{id}
const pollPosterStatus = async (posterId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/posters/${posterId}`);
    const poster = await response.json();

    if (poster.status === 'COMPLETED' || poster.status === 'FAILED') {
      clearInterval(interval);
      // Update UI
    }
  }, 2000); // Poll every 2 seconds
};
```

### Option 2: WebSocket
```typescript
// Frontend establishes WebSocket connection
const ws = new WebSocket('wss://api.example.com/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.posterId === currentPosterId) {
    // Update UI in real-time
  }
};

// Backend publishes to WebSocket when poster completes
// Requires API Gateway WebSocket API + Connection management
```

---

## Decision

**We will use HTTP Polling for the MVP (Phases 1-3), with WebSocket as a post-launch enhancement.**

Polling implementation details:
- Poll interval: 3 seconds
- Max polling duration: 60 seconds (20 attempts)
- Exponential backoff after 30 seconds (3s → 5s → 10s)
- Client-side timeout with helpful error message

---

## Rationale

### Why Polling for MVP?

| Factor | Polling | WebSocket |
|--------|---------|-----------|
| **Implementation Complexity** | ✅ Simple REST endpoint | ❌ Requires WebSocket API Gateway, connection table in DynamoDB, Lambda authorizer |
| **Infrastructure** | ✅ Already have REST API Gateway | ❌ Need separate WebSocket API Gateway + connection management Lambda |
| **Junior Developer Learning Curve** | ✅ Familiar HTTP patterns | ❌ Need to learn WebSocket lifecycle, connection persistence, broadcast patterns |
| **Cost (1000 posters/day)** | ✅ ~60,000 API calls/day = $0.02/day | ✅ Comparable (~$0.05/day with connection management) |
| **User Experience** | ⚠️ 3-second delay vs instant | ✅ Instant updates |
| **Debugging** | ✅ Easy to inspect with browser DevTools | ❌ Requires WebSocket debugging tools |
| **Deployment Complexity** | ✅ Single CDK stack | ❌ Additional stack with connection management |

### Performance Analysis

**Average poster generation time:** 15 seconds

With 3-second polling:
- Best case: User sees "ready" in 3 seconds after completion
- Worst case: User sees "ready" in 6 seconds after completion
- **Average perceived wait: 15 seconds (actual) + 4.5 seconds (polling lag) = 19.5 seconds**

This 4.5-second average lag is acceptable for MVP given the reduced complexity.

### Cost Comparison

**Scenario: 1000 posters generated per day**

**Polling:**
- Average polls per poster: 15s generation ÷ 3s interval = 5 polls
- Daily API calls: 1000 × 5 = 5,000 calls
- Monthly API calls: 150,000 calls
- **Cost: $0.60/month** (after free tier)

**WebSocket:**
- Connection establishment: 1000/day
- Message broadcasts: 1000/day
- Connection management Lambda invocations: 2000/day (connect + disconnect)
- DynamoDB writes (connection table): 2000/day
- **Cost: ~$1.50/month** (Lambda + DynamoDB + API Gateway WebSocket)

**Delta:** $0.90/month - negligible, but polling is simpler.

---

## Implementation Guide

### Frontend Implementation

```typescript
// apps/web/src/hooks/usePosterStatus.ts
import { useState, useEffect } from 'react';

interface PosterStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  error?: string;
}

export function usePosterStatus(posterId: string) {
  const [poster, setPoster] = useState<PosterStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const getInterval = (attempt: number) => {
      if (attempt < 10) return 3000;  // 0-30s: poll every 3s
      if (attempt < 15) return 5000;  // 30-45s: poll every 5s
      return 10000;                   // 45-60s: poll every 10s
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/posters/${posterId}`);
        const data = await response.json();
        setPoster(data);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          setIsPolling(false);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setPoster({
            ...data,
            status: 'FAILED',
            error: 'Generation timed out. Please try again.'
          });
          setIsPolling(false);
          return;
        }

        setTimeout(poll, getInterval(attempts));
      } catch (error) {
        setPoster({
          id: posterId,
          status: 'FAILED',
          error: 'Network error. Please check your connection.'
        });
        setIsPolling(false);
      }
    };

    if (isPolling) {
      poll();
    }

    return () => setIsPolling(false); // Cleanup on unmount
  }, [posterId, isPolling]);

  return { poster, isPolling };
}
```

### Backend Implementation

```typescript
// apps/api/src/handlers/poster/get-poster.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPosterById } from '@bjj-poster/db';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, s3Client } from '@bjj-poster/core';

export const handler: APIGatewayProxyHandler = async (event) => {
  const posterId = event.pathParameters?.id;
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!posterId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Poster ID required' }),
    };
  }

  const poster = await getPosterById(userId, posterId);

  if (!poster) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Poster not found' }),
    };
  }

  // Generate presigned URL if poster is completed
  let downloadUrl: string | undefined;
  if (poster.status === 'COMPLETED' && poster.s3Key) {
    const command = new GetObjectCommand({
      Bucket: process.env.GENERATED_BUCKET!,
      Key: poster.s3Key,
    });
    downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  return {
    statusCode: 200,
    headers: {
      'Cache-Control': poster.status === 'COMPLETED'
        ? 'public, max-age=3600'  // Cache completed posters for 1 hour
        : 'no-cache',              // Don't cache pending/processing
    },
    body: JSON.stringify({
      id: poster.id,
      status: poster.status,
      downloadUrl,
      createdAt: poster.createdAt,
      updatedAt: poster.updatedAt,
    }),
  };
};
```

---

## Consequences

### Positive

✅ **Faster MVP delivery** - No WebSocket infrastructure needed
✅ **Simpler codebase** - Junior developers can implement polling in 1 day
✅ **Easier debugging** - Standard HTTP request/response visible in DevTools
✅ **Familiar patterns** - Team already understands REST APIs
✅ **Lower infrastructure cost** - One fewer AWS service to manage

### Negative

❌ **Slight UX delay** - 3-6 second lag between completion and user notification
❌ **Unnecessary API calls** - Some polls when poster is still processing
❌ **Client battery usage** - Active polling consumes more power than passive WebSocket
❌ **Not real-time** - Cannot push updates for other events (e.g., template library changes)

### Neutral

⚠️ **Migration path exists** - Can add WebSocket in Phase 4 without breaking changes
⚠️ **Polling is proven** - Many production apps use polling for async operations

---

## Future Considerations

### When to Migrate to WebSocket?

Consider WebSocket when:
1. **User base grows beyond 10,000 active users** - Polling load becomes significant
2. **Real-time features expand** - e.g., collaborative poster editing, live template previews
3. **User feedback indicates UX issues** - Complaints about perceived slowness
4. **Cost analysis favors WebSocket** - High polling volume makes WebSocket cheaper

### Migration Strategy

The API contract won't change:
```typescript
// Polling continues to work
GET /api/posters/{id} → { status, downloadUrl }

// WebSocket added as enhancement
ws://api.example.com/ws → Real-time updates

// Frontend can use both
usePosterStatus(id, { preferWebSocket: true })
```

Clients can gracefully fall back to polling if WebSocket unavailable.

---

## References

- [API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/)
- [WebSocket API vs REST API Trade-offs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-overview.html)
- [Polling Best Practices](https://stackoverflow.com/questions/11077857/what-are-long-polling-websockets-server-sent-events-sse-and-comet)

---

## Review History

| Date | Reviewer | Status |
|------|----------|--------|
| 2025-01-05 | Team | Accepted |
