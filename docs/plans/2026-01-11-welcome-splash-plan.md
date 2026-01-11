# Welcome Splash Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a welcome splash screen that shows once for first-time users with product overview and navigation to the builder.

**Architecture:** Client-side overlay component with localStorage persistence. Custom hook handles state and navigation. Renders conditionally in dashboard page.

**Tech Stack:** React, Next.js (useRouter), localStorage, Vitest, Testing Library

---

## Task 1: Create useWelcomeSplash Hook with Tests

**Files:**
- Create: `apps/web/components/onboarding/use-welcome-splash.ts`
- Create: `apps/web/components/onboarding/__tests__/use-welcome-splash.test.ts`

### Step 1: Write the failing tests

```typescript
// apps/web/components/onboarding/__tests__/use-welcome-splash.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWelcomeSplash } from '../use-welcome-splash';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useWelcomeSplash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows splash when localStorage flag is not set', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showSplash).toBe(true);
  });

  it('hides splash when localStorage flag is "true"', () => {
    localStorage.setItem('hasSeenWelcome', 'true');

    const { result } = renderHook(() => useWelcomeSplash());

    expect(result.current.showSplash).toBe(false);
  });

  it('dismiss with "builder" sets flag and navigates to /builder', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    act(() => {
      result.current.dismiss('builder');
    });

    expect(localStorage.getItem('hasSeenWelcome')).toBe('true');
    expect(result.current.showSplash).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/builder');
  });

  it('dismiss with "dashboard" sets flag without navigation', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    act(() => {
      result.current.dismiss('dashboard');
    });

    expect(localStorage.getItem('hasSeenWelcome')).toBe('true');
    expect(result.current.showSplash).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd apps/web && pnpm test use-welcome-splash`
Expected: FAIL with "Cannot find module '../use-welcome-splash'"

### Step 3: Write the hook implementation

```typescript
// apps/web/components/onboarding/use-welcome-splash.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'hasSeenWelcome';

interface UseWelcomeSplashReturn {
  showSplash: boolean;
  isLoading: boolean;
  dismiss: (navigateTo: 'builder' | 'dashboard') => void;
}

export function useWelcomeSplash(): UseWelcomeSplashReturn {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    setShowSplash(hasSeenWelcome !== 'true');
    setIsLoading(false);
  }, []);

  const dismiss = (navigateTo: 'builder' | 'dashboard'): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowSplash(false);
    if (navigateTo === 'builder') {
      router.push('/builder');
    }
  };

  return { showSplash, isLoading, dismiss };
}
```

### Step 4: Run tests to verify they pass

Run: `cd apps/web && pnpm test use-welcome-splash`
Expected: PASS (4 tests)

### Step 5: Commit

```bash
git add apps/web/components/onboarding/use-welcome-splash.ts apps/web/components/onboarding/__tests__/use-welcome-splash.test.ts
git commit -m "feat(onboarding): add useWelcomeSplash hook with localStorage logic"
```

---

## Task 2: Create WelcomeSplash Component with Tests

**Files:**
- Create: `apps/web/components/onboarding/welcome-splash.tsx`
- Create: `apps/web/components/onboarding/__tests__/welcome-splash.test.tsx`

### Step 1: Write the failing tests

```typescript
// apps/web/components/onboarding/__tests__/welcome-splash.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeSplash } from '../welcome-splash';

// Mock the hook
const mockDismiss = vi.fn();
vi.mock('../use-welcome-splash', () => ({
  useWelcomeSplash: vi.fn(() => ({
    showSplash: true,
    isLoading: false,
    dismiss: mockDismiss,
  })),
}));

// Get reference to mock for manipulation
import { useWelcomeSplash } from '../use-welcome-splash';
const mockUseWelcomeSplash = vi.mocked(useWelcomeSplash);

describe('WelcomeSplash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: true,
      isLoading: false,
      dismiss: mockDismiss,
    });
  });

  it('renders splash overlay when showSplash is true', () => {
    render(<WelcomeSplash />);

    expect(screen.getByText('BJJ Poster Builder')).toBeInTheDocument();
    expect(screen.getByText('Create Tournament Posters in 3 Steps')).toBeInTheDocument();
  });

  it('does not render when showSplash is false', () => {
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: false,
      isLoading: false,
      dismiss: mockDismiss,
    });

    render(<WelcomeSplash />);

    expect(screen.queryByText('BJJ Poster Builder')).not.toBeInTheDocument();
  });

  it('does not render while loading', () => {
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: true,
      isLoading: true,
      dismiss: mockDismiss,
    });

    render(<WelcomeSplash />);

    expect(screen.queryByText('BJJ Poster Builder')).not.toBeInTheDocument();
  });

  it('calls dismiss with "builder" when CTA is clicked', () => {
    render(<WelcomeSplash />);

    fireEvent.click(screen.getByRole('button', { name: /create my first poster/i }));

    expect(mockDismiss).toHaveBeenCalledWith('builder');
  });

  it('calls dismiss with "dashboard" when skip is clicked', () => {
    render(<WelcomeSplash />);

    fireEvent.click(screen.getByRole('button', { name: /skip to dashboard/i }));

    expect(mockDismiss).toHaveBeenCalledWith('dashboard');
  });

  it('displays benefits list', () => {
    render(<WelcomeSplash />);

    expect(screen.getByText(/no design skills needed/i)).toBeInTheDocument();
    expect(screen.getByText(/professional quality/i)).toBeInTheDocument();
    expect(screen.getByText(/share instantly/i)).toBeInTheDocument();
  });

  it('displays example poster placeholders', () => {
    render(<WelcomeSplash />);

    const posters = screen.getAllByTestId('poster-placeholder');
    expect(posters).toHaveLength(3);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd apps/web && pnpm test welcome-splash.test`
Expected: FAIL with "Cannot find module '../welcome-splash'"

### Step 3: Write the component implementation

```typescript
// apps/web/components/onboarding/welcome-splash.tsx
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useWelcomeSplash } from './use-welcome-splash';

const BENEFITS = [
  'No design skills needed',
  'Professional quality',
  'Share instantly',
] as const;

export function WelcomeSplash(): JSX.Element | null {
  const { showSplash, isLoading, dismiss } = useWelcomeSplash();

  if (isLoading || !showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/95 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl rounded-2xl border border-surface-700 bg-surface-800 p-8 text-center shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <span className="text-4xl" role="img" aria-label="martial arts">
            🥋
          </span>
          <h1 className="mt-2 font-display text-3xl tracking-wide text-white">
            BJJ Poster Builder
          </h1>
        </div>

        {/* Headline */}
        <p className="mb-8 text-xl text-surface-300">
          Create Tournament Posters in 3 Steps
        </p>

        {/* Example Posters */}
        <div className="mb-8 flex justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid="poster-placeholder"
              className="aspect-[3/4] w-24 rounded-lg bg-gradient-to-br from-surface-700 to-surface-600 shadow-lg sm:w-28"
            />
          ))}
        </div>

        {/* Benefits */}
        <ul className="mb-8 space-y-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center justify-center gap-2 text-surface-300"
            >
              <span className="text-gold-500">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => dismiss('builder')}
        >
          Create My First Poster
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Skip Link */}
        <button
          type="button"
          onClick={() => dismiss('dashboard')}
          className="mt-4 text-sm text-surface-400 transition-colors hover:text-white"
        >
          Skip to Dashboard
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Run tests to verify they pass

Run: `cd apps/web && pnpm test welcome-splash.test`
Expected: PASS (7 tests)

### Step 5: Commit

```bash
git add apps/web/components/onboarding/welcome-splash.tsx apps/web/components/onboarding/__tests__/welcome-splash.test.tsx
git commit -m "feat(onboarding): add WelcomeSplash component with overlay UI"
```

---

## Task 3: Create Barrel Export

**Files:**
- Create: `apps/web/components/onboarding/index.ts`

### Step 1: Create barrel export file

```typescript
// apps/web/components/onboarding/index.ts
export { WelcomeSplash } from './welcome-splash';
export { useWelcomeSplash } from './use-welcome-splash';
```

### Step 2: Verify imports work

Run: `cd apps/web && pnpm type-check`
Expected: PASS (no type errors)

### Step 3: Commit

```bash
git add apps/web/components/onboarding/index.ts
git commit -m "feat(onboarding): add barrel export for onboarding components"
```

---

## Task 4: Integrate WelcomeSplash in Dashboard

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`

### Step 1: Write integration test

```typescript
// Add to apps/web/app/dashboard/__tests__/page.test.tsx (or create if needed)
// This test verifies WelcomeSplash is rendered in the dashboard

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '../page';

// Mock all child components
vi.mock('@/components/onboarding', () => ({
  WelcomeSplash: () => <div data-testid="welcome-splash">WelcomeSplash</div>,
}));

vi.mock('@/components/checkout', () => ({
  UpgradeSuccessHandler: () => <div data-testid="upgrade-handler">UpgradeSuccessHandler</div>,
}));

vi.mock('@/components/dashboard', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">WelcomeSection</div>,
  CreateNewCard: () => <div data-testid="create-new-card">CreateNewCard</div>,
}));

vi.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('DashboardPage', () => {
  it('renders WelcomeSplash component', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('welcome-splash')).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd apps/web && pnpm test dashboard/page`
Expected: FAIL (WelcomeSplash not rendered yet)

### Step 3: Modify dashboard page to include WelcomeSplash

```typescript
// apps/web/app/dashboard/page.tsx
'use client';

import { WelcomeSection, CreateNewCard } from '@/components/dashboard';
import { UpgradeSuccessHandler } from '@/components/checkout';
import { WelcomeSplash } from '@/components/onboarding';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <WelcomeSplash />
      <UpgradeSuccessHandler />
      <ErrorBoundary>
        <WelcomeSection />
      </ErrorBoundary>

      {/* Your Posters Section */}
      <section>
        <h2 className="mb-6 font-display text-2xl tracking-wide text-white">
          YOUR POSTERS
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Create New Card - Always first */}
          <CreateNewCard />

          {/* Poster cards will be rendered here by ODE-72 */}
        </div>
      </section>
    </main>
  );
}
```

### Step 4: Run test to verify it passes

Run: `cd apps/web && pnpm test dashboard/page`
Expected: PASS

### Step 5: Run all tests and type-check

Run: `cd apps/web && pnpm test && pnpm type-check`
Expected: ALL PASS

### Step 6: Commit

```bash
git add apps/web/app/dashboard/page.tsx apps/web/app/dashboard/__tests__/page.test.tsx
git commit -m "feat(dashboard): integrate WelcomeSplash for first-time users"
```

---

## Task 5: Final Verification

### Step 1: Run full test suite

Run: `pnpm test`
Expected: ALL PASS

### Step 2: Run linting

Run: `pnpm lint`
Expected: No errors

### Step 3: Run type-check

Run: `pnpm type-check`
Expected: No errors

### Step 4: Manual verification (optional)

Run: `pnpm dev`
1. Open http://localhost:3000/dashboard
2. Verify splash screen appears
3. Click "Create My First Poster" - should navigate to /builder
4. Return to dashboard - splash should NOT appear again
5. Clear localStorage and refresh - splash should appear again

### Step 5: Final commit if any fixes needed

```bash
git add -A
git commit -m "fix(onboarding): address any issues from verification"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | useWelcomeSplash hook | hook + tests |
| 2 | WelcomeSplash component | component + tests |
| 3 | Barrel export | index.ts |
| 4 | Dashboard integration | page.tsx + tests |
| 5 | Final verification | full test suite |

**Total new files:** 5
**Modified files:** 1
