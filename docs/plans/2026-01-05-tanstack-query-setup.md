# TanStack Query Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure TanStack Query for server state management with caching for templates and poster history.

**Architecture:** Provider-based setup wrapping the Next.js app, with a clean separation between API fetch functions (lib/api/) and React Query hooks (lib/hooks/). Mock implementations simulate real API behavior for development.

**Tech Stack:** TanStack Query v5, Next.js 14, TypeScript, Vitest

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install TanStack Query packages**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm add @tanstack/react-query @tanstack/react-query-devtools --filter @bjj-poster/web
```

Expected: packages added to package.json dependencies

**Step 2: Verify installation**

Run:
```bash
cat apps/web/package.json | grep tanstack
```

Expected: Both `@tanstack/react-query` and `@tanstack/react-query-devtools` listed

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): install TanStack Query dependencies"
```

---

## Task 2: Create TypeScript Interfaces

**Files:**
- Create: `apps/web/lib/types/api.ts`

**Step 1: Create the types file**

```typescript
/**
 * Template entity from the API
 */
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
}

/**
 * Poster entity from the API
 */
export interface Poster {
  id: string;
  templateId: string;
  createdAt: string;
  thumbnailUrl: string;
  title: string;
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/types/api.ts
git commit -m "feat(web): add API type definitions for Template and Poster"
```

---

## Task 3: Create API Client

**Files:**
- Create: `apps/web/lib/api/client.ts`

**Step 1: Create the API client with error handling**

```typescript
/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Type-safe fetch wrapper with error handling
 */
export async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }
  return response.json();
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/api/client.ts
git commit -m "feat(web): add API client with typed error handling"
```

---

## Task 4: Create Mock Templates API

**Files:**
- Create: `apps/web/lib/api/templates.ts`

**Step 1: Create the mock templates fetch function**

```typescript
import type { Template } from '../types/api';

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    name: 'Classic Tournament',
    category: 'tournament',
    thumbnailUrl: '/templates/classic.png',
  },
  {
    id: 'tpl-002',
    name: 'Modern Minimal',
    category: 'tournament',
    thumbnailUrl: '/templates/modern.png',
  },
  {
    id: 'tpl-003',
    name: 'Competition Pro',
    category: 'competition',
    thumbnailUrl: '/templates/competition.png',
  },
  {
    id: 'tpl-004',
    name: 'Kids Championship',
    category: 'kids',
    thumbnailUrl: '/templates/kids.png',
  },
];

/**
 * Fetches all available templates
 * TODO: Replace with real API call when backend is ready
 */
export async function fetchTemplates(): Promise<Template[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_TEMPLATES;
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/api/templates.ts
git commit -m "feat(web): add mock templates API function"
```

---

## Task 5: Create Mock Posters API

**Files:**
- Create: `apps/web/lib/api/posters.ts`

**Step 1: Create the mock poster history fetch function**

```typescript
import type { Poster } from '../types/api';

const MOCK_POSTERS: Record<string, Poster[]> = {
  'user-001': [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      title: 'Spring Championship 2026',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-03T14:30:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      title: 'Kids Open Mat',
    },
  ],
};

/**
 * Fetches poster history for a specific user
 * TODO: Replace with real API call when backend is ready
 */
export async function fetchPosterHistory(userId: string): Promise<Poster[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_POSTERS[userId] ?? [];
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/api/posters.ts
git commit -m "feat(web): add mock poster history API function"
```

---

## Task 6: Create API Barrel Export

**Files:**
- Create: `apps/web/lib/api/index.ts`

**Step 1: Create barrel export**

```typescript
export { ApiError, apiFetch } from './client';
export { fetchTemplates } from './templates';
export { fetchPosterHistory } from './posters';
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/api/index.ts
git commit -m "feat(web): add API barrel export"
```

---

## Task 7: Create Query Provider

**Files:**
- Create: `apps/web/app/providers.tsx`

**Step 1: Create the providers file**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Creates a new QueryClient with default options
 * Extracted to function for SSR-safe instantiation
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Application providers wrapper
 * Includes QueryClientProvider and React Query DevTools
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per app instance (SSR-safe)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/app/providers.tsx
git commit -m "feat(web): add QueryClient provider with DevTools"
```

---

## Task 8: Wrap App with Providers

**Files:**
- Modify: `apps/web/app/layout.tsx`

**Step 1: Import and wrap with Providers**

Add import at top:
```typescript
import { Providers } from './providers';
```

Update body content:
```typescript
<body className="font-body antialiased">
  <Providers>{children}</Providers>
</body>
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Verify app builds**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm build --filter @bjj-poster/web
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(web): wrap app with QueryClientProvider"
```

---

## Task 9: Create Test Utilities

**Files:**
- Create: `apps/web/lib/hooks/__tests__/test-utils.tsx`

**Step 1: Create test utilities**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Creates a QueryClient configured for testing
 * - retry: false - fail fast
 * - gcTime: 0 - no caching between tests
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/**
 * Creates a wrapper component for testing hooks
 */
export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/hooks/__tests__/test-utils.tsx
git commit -m "test(web): add React Query test utilities"
```

---

## Task 10: Create useTemplates Hook - Write Failing Tests

**Files:**
- Create: `apps/web/lib/hooks/__tests__/use-templates.test.ts`

**Step 1: Write the failing tests**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useTemplates } from '../use-templates';
import { createWrapper } from './test-utils';

vi.mock('../../api/templates');

describe('useTemplates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    const { fetchTemplates } = vi.mocked(
      await import('../../api/templates')
    );
    fetchTemplates.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns templates data on success', async () => {
    const mockTemplates = [
      { id: '1', name: 'Test', category: 'test', thumbnailUrl: '/test.png' },
    ];
    const { fetchTemplates } = vi.mocked(
      await import('../../api/templates')
    );
    fetchTemplates.mockResolvedValue(mockTemplates);

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates);
  });

  it('returns error state on failure', async () => {
    const { fetchTemplates } = vi.mocked(
      await import('../../api/templates')
    );
    fetchTemplates.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm test --filter @bjj-poster/web -- use-templates
```

Expected: FAIL - useTemplates not found

**Step 3: Commit failing tests**

```bash
git add apps/web/lib/hooks/__tests__/use-templates.test.ts
git commit -m "test(web): add failing tests for useTemplates hook"
```

---

## Task 11: Implement useTemplates Hook

**Files:**
- Create: `apps/web/lib/hooks/use-templates.ts`

**Step 1: Implement the hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchTemplates } from '../api/templates';
import type { Template } from '../types/api';

/**
 * Fetches all available templates
 * Query key: ['templates']
 */
export function useTemplates() {
  return useQuery<Template[], Error>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });
}
```

**Step 2: Run tests to verify they pass**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm test --filter @bjj-poster/web -- use-templates
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/web/lib/hooks/use-templates.ts
git commit -m "feat(web): implement useTemplates hook"
```

---

## Task 12: Create usePosterHistory Hook - Write Failing Tests

**Files:**
- Create: `apps/web/lib/hooks/__tests__/use-poster-history.test.ts`

**Step 1: Write the failing tests**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePosterHistory } from '../use-poster-history';
import { createWrapper } from './test-utils';

vi.mock('../../api/posters');

describe('usePosterHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state when userId provided', () => {
    const { fetchPosterHistory } = vi.mocked(
      await import('../../api/posters')
    );
    fetchPosterHistory.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when userId is undefined', () => {
    const { fetchPosterHistory } = vi.mocked(
      await import('../../api/posters')
    );

    const { result } = renderHook(() => usePosterHistory(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchPosterHistory).not.toHaveBeenCalled();
  });

  it('returns poster data on success', async () => {
    const mockPosters = [
      {
        id: 'p1',
        templateId: 't1',
        createdAt: '2026-01-01',
        thumbnailUrl: '/p1.png',
        title: 'Test Poster',
      },
    ];
    const { fetchPosterHistory } = vi.mocked(
      await import('../../api/posters')
    );
    fetchPosterHistory.mockResolvedValue(mockPosters);

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPosters);
    expect(fetchPosterHistory).toHaveBeenCalledWith('user-001');
  });

  it('returns error state on failure', async () => {
    const { fetchPosterHistory } = vi.mocked(
      await import('../../api/posters')
    );
    fetchPosterHistory.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm test --filter @bjj-poster/web -- use-poster-history
```

Expected: FAIL - usePosterHistory not found

**Step 3: Commit failing tests**

```bash
git add apps/web/lib/hooks/__tests__/use-poster-history.test.ts
git commit -m "test(web): add failing tests for usePosterHistory hook"
```

---

## Task 13: Implement usePosterHistory Hook

**Files:**
- Create: `apps/web/lib/hooks/use-poster-history.ts`

**Step 1: Implement the hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchPosterHistory } from '../api/posters';
import type { Poster } from '../types/api';

/**
 * Fetches poster history for a specific user
 * Query key: ['posters', userId]
 * Only fetches when userId is provided
 */
export function usePosterHistory(userId: string | undefined) {
  return useQuery<Poster[], Error>({
    queryKey: ['posters', userId],
    queryFn: () => fetchPosterHistory(userId!),
    enabled: !!userId,
  });
}
```

**Step 2: Run tests to verify they pass**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm test --filter @bjj-poster/web -- use-poster-history
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/web/lib/hooks/use-poster-history.ts
git commit -m "feat(web): implement usePosterHistory hook"
```

---

## Task 14: Create Hooks Barrel Export

**Files:**
- Create: `apps/web/lib/hooks/index.ts`

**Step 1: Create barrel export**

```typescript
export { useTemplates } from './use-templates';
export { usePosterHistory } from './use-poster-history';
```

**Step 2: Verify types compile**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/hooks/index.ts
git commit -m "feat(web): add hooks barrel export"
```

---

## Task 15: Final Verification

**Step 1: Run all tests**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm test --filter @bjj-poster/web
```

Expected: All tests pass

**Step 2: Run type check**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm type-check --filter @bjj-poster/web
```

Expected: No errors

**Step 3: Run lint**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm lint --filter @bjj-poster/web
```

Expected: No errors (or only warnings)

**Step 4: Build the app**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm build --filter @bjj-poster/web
```

Expected: Build succeeds

---

## Summary

After completing all tasks, you will have:
- TanStack Query installed and configured
- QueryClient with sensible defaults (5min stale, 30min gc, 1 retry)
- Provider wrapping the app with DevTools enabled
- `useTemplates()` hook with query key `['templates']`
- `usePosterHistory(userId)` hook with query key `['posters', userId]`
- Full test coverage for both hooks
- Mock API functions ready to swap for real endpoints
