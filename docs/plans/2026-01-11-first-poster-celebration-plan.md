# First Poster Celebration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a celebration modal after a user creates their first poster, with download and sharing options.

**Architecture:** Create a `FirstPosterCelebration` component with a companion `useFirstPosterCelebration` hook. The hook manages modal visibility, poster data, and download state. Trigger from `GenerateButton` when `postersThisMonth === 0` before incrementing usage.

**Tech Stack:** React, Zustand, Next.js, Tailwind CSS, Lucide icons, Web Share API

---

## Task 1: Create useFirstPosterCelebration Hook

**Files:**
- Create: `apps/web/components/onboarding/use-first-poster-celebration.ts`
- Test: `apps/web/components/onboarding/__tests__/use-first-poster-celebration.test.ts`

### Step 1: Write the failing tests

Create the test file with all test cases:

```typescript
// apps/web/components/onboarding/__tests__/use-first-poster-celebration.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFirstPosterCelebration } from '../use-first-poster-celebration';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock user store
const mockIncrementUsage = vi.fn();
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: {
    getState: () => ({
      incrementUsage: mockIncrementUsage,
    }),
  },
}));

describe('useFirstPosterCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with showCelebration false', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    expect(result.current.showCelebration).toBe(false);
    expect(result.current.posterData).toBeNull();
    expect(result.current.hasDownloaded).toBe(false);
  });

  it('triggerCelebration sets showCelebration true and stores poster data', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());
    const posterData = { imageUrl: '/test.png', posterId: '123' };

    act(() => {
      result.current.triggerCelebration(posterData);
    });

    expect(result.current.showCelebration).toBe(true);
    expect(result.current.posterData).toEqual(posterData);
  });

  it('does not trigger if localStorage flag already set', () => {
    localStorage.setItem('hasCreatedFirstPoster', 'true');
    const { result } = renderHook(() => useFirstPosterCelebration());
    const posterData = { imageUrl: '/test.png', posterId: '123' };

    act(() => {
      result.current.triggerCelebration(posterData);
    });

    expect(result.current.showCelebration).toBe(false);
  });

  it('markDownloaded sets hasDownloaded to true', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    act(() => {
      result.current.triggerCelebration({ imageUrl: '/test.png', posterId: '123' });
    });

    act(() => {
      result.current.markDownloaded();
    });

    expect(result.current.hasDownloaded).toBe(true);
  });

  it('dismiss sets localStorage flag, resets state, increments usage, and navigates', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    act(() => {
      result.current.triggerCelebration({ imageUrl: '/test.png', posterId: '123' });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem('hasCreatedFirstPoster')).toBe('true');
    expect(result.current.showCelebration).toBe(false);
    expect(result.current.posterData).toBeNull();
    expect(mockIncrementUsage).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd apps/web && pnpm test use-first-poster-celebration.test.ts`

Expected: FAIL - module not found

### Step 3: Write the hook implementation

```typescript
// apps/web/components/onboarding/use-first-poster-celebration.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/user-store';

const STORAGE_KEY = 'hasCreatedFirstPoster';

export interface PosterData {
  imageUrl: string;
  posterId: string;
}

export interface UseFirstPosterCelebrationReturn {
  showCelebration: boolean;
  posterData: PosterData | null;
  hasDownloaded: boolean;
  triggerCelebration: (data: PosterData) => void;
  markDownloaded: () => void;
  dismiss: () => void;
}

export function useFirstPosterCelebration(): UseFirstPosterCelebrationReturn {
  const [showCelebration, setShowCelebration] = useState(false);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);
  const router = useRouter();

  // Check localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasSeenBefore(seen === 'true');
  }, []);

  const triggerCelebration = useCallback(
    (data: PosterData): void => {
      // Don't show if already seen
      if (hasSeenBefore || localStorage.getItem(STORAGE_KEY) === 'true') {
        return;
      }
      setPosterData(data);
      setShowCelebration(true);
    },
    [hasSeenBefore]
  );

  const markDownloaded = useCallback((): void => {
    setHasDownloaded(true);
  }, []);

  const dismiss = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowCelebration(false);
    setPosterData(null);
    setHasDownloaded(false);
    useUserStore.getState().incrementUsage();
    router.push('/dashboard');
  }, [router]);

  return {
    showCelebration,
    posterData,
    hasDownloaded,
    triggerCelebration,
    markDownloaded,
    dismiss,
  };
}
```

### Step 4: Run tests to verify they pass

Run: `cd apps/web && pnpm test use-first-poster-celebration.test.ts`

Expected: All 5 tests PASS

### Step 5: Commit

```bash
git add apps/web/components/onboarding/use-first-poster-celebration.ts apps/web/components/onboarding/__tests__/use-first-poster-celebration.test.ts
git commit -m "feat(onboarding): add useFirstPosterCelebration hook"
```

---

## Task 2: Update Analytics Types

**Files:**
- Modify: `apps/web/lib/analytics.ts`

### Step 1: Add celebration event types

```typescript
// Add to AnalyticsEvent type union (after 'quota_limit_maybe_later_clicked')
  | 'first_poster_celebration_viewed'
  | 'first_poster_downloaded'
  | 'first_poster_shared'
  | 'first_poster_celebration_dismissed'
```

```typescript
// Add new interface after QuotaLimitProperties
export interface FirstPosterCelebrationProperties {
  tier?: string;
  platform?: 'facebook' | 'native_share' | 'copy_link';
  source?: string;
}
```

```typescript
// Update EventProperties union
export type EventProperties = UpgradePromptProperties | QuotaLimitProperties | FirstPosterCelebrationProperties;
```

### Step 2: Commit

```bash
git add apps/web/lib/analytics.ts
git commit -m "feat(analytics): add first poster celebration events"
```

---

## Task 3: Create FirstPosterCelebration Component

**Files:**
- Create: `apps/web/components/onboarding/first-poster-celebration.tsx`
- Test: `apps/web/components/onboarding/__tests__/first-poster-celebration.test.tsx`

### Step 1: Write the failing tests

```typescript
// apps/web/components/onboarding/__tests__/first-poster-celebration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirstPosterCelebration } from '../first-poster-celebration';

// Mock the hook
const mockTriggerCelebration = vi.fn();
const mockMarkDownloaded = vi.fn();
const mockDismiss = vi.fn();

vi.mock('../use-first-poster-celebration', () => ({
  useFirstPosterCelebration: vi.fn(() => ({
    showCelebration: true,
    posterData: { imageUrl: '/test-poster.png', posterId: '123' },
    hasDownloaded: false,
    triggerCelebration: mockTriggerCelebration,
    markDownloaded: mockMarkDownloaded,
    dismiss: mockDismiss,
  })),
}));

// Mock user store
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn((selector) =>
    selector({
      subscriptionTier: 'free',
      postersThisMonth: 1,
      postersLimit: 3,
    })
  ),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

// Get reference to mocks
import { useFirstPosterCelebration } from '../use-first-poster-celebration';
import { useUserStore } from '@/lib/stores/user-store';
const mockUseFirstPosterCelebration = vi.mocked(useFirstPosterCelebration);
const mockUseUserStore = vi.mocked(useUserStore);

describe('FirstPosterCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: false,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        subscriptionTier: 'free',
        postersThisMonth: 1,
        postersLimit: 3,
        user: null,
        setUser: vi.fn(),
        resetUser: vi.fn(),
        canCreatePoster: vi.fn(),
        incrementUsage: vi.fn(),
      })
    );
  });

  it('renders celebration modal when showCelebration is true', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('You created your first tournament poster!')).toBeInTheDocument();
  });

  it('does not render when showCelebration is false', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: false,
      posterData: null,
      hasDownloaded: false,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
  });

  it('displays poster image', () => {
    render(<FirstPosterCelebration />);

    const img = screen.getByRole('img', { name: /generated poster/i });
    expect(img).toHaveAttribute('src', expect.stringContaining('test-poster.png'));
  });

  it('shows download button', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByRole('button', { name: /download poster/i })).toBeInTheDocument();
  });

  it('hides Go to Dashboard button when not downloaded', () => {
    render(<FirstPosterCelebration />);

    expect(screen.queryByRole('button', { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it('shows Go to Dashboard button after download', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('calls dismiss when Go to Dashboard is clicked', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('shows quota reminder for free users', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText(/you have 2 posters left this month/i)).toBeInTheDocument();
    expect(screen.getByText(/free plan/i)).toBeInTheDocument();
  });

  it('shows upsell link for free users', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText(/want unlimited posters/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see pro plans/i })).toHaveAttribute('href', '/pricing');
  });

  it('hides upsell for pro users', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        subscriptionTier: 'pro',
        postersThisMonth: 1,
        postersLimit: 20,
        user: null,
        setUser: vi.fn(),
        resetUser: vi.fn(),
        canCreatePoster: vi.fn(),
        incrementUsage: vi.fn(),
      })
    );

    render(<FirstPosterCelebration />);

    expect(screen.queryByText(/want unlimited posters/i)).not.toBeInTheDocument();
  });

  it('shows social share buttons after download', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.getByLabelText(/share on facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd apps/web && pnpm test first-poster-celebration.test.tsx`

Expected: FAIL - module not found

### Step 3: Write the component implementation

```tsx
// apps/web/components/onboarding/first-poster-celebration.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Facebook, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirstPosterCelebration } from './use-first-poster-celebration';
import { useUserStore } from '@/lib/stores/user-store';
import { track } from '@/lib/analytics';

export function FirstPosterCelebration(): JSX.Element | null {
  const { showCelebration, posterData, hasDownloaded, markDownloaded, dismiss } =
    useFirstPosterCelebration();
  const subscriptionTier = useUserStore((s) => s.subscriptionTier);
  const postersThisMonth = useUserStore((s) => s.postersThisMonth);
  const postersLimit = useUserStore((s) => s.postersLimit);
  const [isDownloading, setIsDownloading] = useState(false);

  const postersRemaining = postersLimit - postersThisMonth;
  const showUpsell = subscriptionTier === 'free';

  // Track view on mount
  useEffect(() => {
    if (showCelebration) {
      track('first_poster_celebration_viewed', { tier: subscriptionTier });
    }
  }, [showCelebration, subscriptionTier]);

  const handleDownload = useCallback(async () => {
    if (!posterData?.imageUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(posterData.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'tournament-poster.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      markDownloaded();
      track('first_poster_downloaded', { tier: subscriptionTier });
    } catch (error) {
      console.error('Download failed:', error);
      // Still mark as downloaded so user can proceed
      markDownloaded();
    } finally {
      setIsDownloading(false);
    }
  }, [posterData, isDownloading, markDownloaded, subscriptionTier]);

  const handleShare = useCallback(async () => {
    if (!posterData?.imageUrl) return;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Tournament Poster',
          text: 'Check out my BJJ tournament poster!',
          url: posterData.imageUrl,
        });
        track('first_poster_shared', { platform: 'native_share', tier: subscriptionTier });
        return;
      } catch (error) {
        // User cancelled or share failed, fall through to copy
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(posterData.imageUrl);
      track('first_poster_shared', { platform: 'copy_link', tier: subscriptionTier });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [posterData, subscriptionTier]);

  const handleFacebookShare = useCallback(() => {
    if (!posterData?.imageUrl) return;

    const encodedUrl = encodeURIComponent(posterData.imageUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    track('first_poster_shared', { platform: 'facebook', tier: subscriptionTier });
  }, [posterData, subscriptionTier]);

  const handleDismiss = useCallback(() => {
    track('first_poster_celebration_dismissed', { tier: subscriptionTier });
    dismiss();
  }, [dismiss, subscriptionTier]);

  if (!showCelebration || !posterData) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <span className="text-4xl" role="img" aria-label="celebration">
            🎉
          </span>
          <h1
            id="celebration-title"
            className="mt-2 font-display text-3xl tracking-wide text-white"
          >
            Congratulations!
          </h1>
          <p className="mt-2 text-lg text-surface-300">
            You created your first tournament poster!
          </p>
        </div>

        {/* Poster Preview */}
        <div className="mb-6 flex justify-center">
          <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-lg border border-surface-700 shadow-2xl">
            <Image
              src={posterData.imageUrl}
              alt="Your generated poster"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Quota Reminder */}
        <p className="mb-6 text-sm text-surface-400">
          You have {postersRemaining} poster{postersRemaining !== 1 ? 's' : ''} left this month
          <span className="ml-1 text-surface-500">
            ({subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'pro' ? 'Pro' : 'Premium'} plan)
          </span>
        </p>

        {/* Download Button */}
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="mr-2 h-5 w-5" />
          {isDownloading ? 'Downloading...' : 'Download Poster'}
        </Button>

        {/* Social Share (after download) */}
        {hasDownloaded && (
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFacebookShare}
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Upsell (free users only) */}
        {showUpsell && (
          <p className="mt-6 text-sm text-surface-400">
            Want unlimited posters?{' '}
            <Link
              href="/pricing"
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              See Pro Plans
            </Link>
          </p>
        )}

        {/* Go to Dashboard (after download) */}
        {hasDownloaded && (
          <Button
            variant="ghost"
            className="mt-4 text-surface-400 hover:text-white"
            onClick={handleDismiss}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Step 4: Run tests to verify they pass

Run: `cd apps/web && pnpm test first-poster-celebration.test.tsx`

Expected: All 11 tests PASS

### Step 5: Commit

```bash
git add apps/web/components/onboarding/first-poster-celebration.tsx apps/web/components/onboarding/__tests__/first-poster-celebration.test.tsx
git commit -m "feat(onboarding): add FirstPosterCelebration component"
```

---

## Task 4: Export from Onboarding Index

**Files:**
- Modify: `apps/web/components/onboarding/index.ts`

### Step 1: Add exports

Add to the end of the file:

```typescript
export { FirstPosterCelebration } from './first-poster-celebration';
export { useFirstPosterCelebration } from './use-first-poster-celebration';
```

### Step 2: Commit

```bash
git add apps/web/components/onboarding/index.ts
git commit -m "feat(onboarding): export FirstPosterCelebration"
```

---

## Task 5: Integrate with GenerateButton

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/generate-button.tsx`
- Test: Update existing tests or add new test file

### Step 1: Write failing test for integration

Create or update test file:

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx
// Add to existing tests or create new file

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateButton } from '../generate-button';

// Mock stores
const mockGeneratePoster = vi.fn();
const mockTriggerCelebration = vi.fn();

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) =>
    selector({
      athletePhoto: new File([''], 'test.png'),
      athleteName: 'Test Athlete',
      beltRank: 'black',
      tournament: 'Test Tournament',
      selectedTemplateId: 'template-1',
      isGenerating: false,
      generationProgress: 0,
      generatePoster: mockGeneratePoster,
    })
  ),
}));

vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn((selector) =>
    selector({
      postersThisMonth: 0,
      incrementUsage: vi.fn(),
    })
  ),
}));

vi.mock('@/components/onboarding', () => ({
  useFirstPosterCelebration: () => ({
    triggerCelebration: mockTriggerCelebration,
  }),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('GenerateButton - First Poster Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneratePoster.mockResolvedValue({
      posterId: '123',
      imageUrl: '/test.png',
      createdAt: new Date().toISOString(),
    });
  });

  it('triggers celebration for first poster (postersThisMonth === 0)', async () => {
    render(<GenerateButton />);

    fireEvent.click(screen.getByRole('button', { name: /generate poster/i }));

    await waitFor(() => {
      expect(mockTriggerCelebration).toHaveBeenCalledWith({
        imageUrl: '/test.png',
        posterId: '123',
      });
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd apps/web && pnpm test generate-button.test.tsx`

Expected: FAIL - triggerCelebration not called

### Step 3: Modify GenerateButton

Update `apps/web/components/builder/poster-builder-form/generate-button.tsx`:

```tsx
'use client';

import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePosterBuilderStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/user-store';
import { useFirstPosterCelebration } from '@/components/onboarding';
import { cn } from '@/lib/utils';

export function GenerateButton(): JSX.Element {
  const router = useRouter();
  const { triggerCelebration } = useFirstPosterCelebration();
  const postersThisMonth = useUserStore((s) => s.postersThisMonth);
  const incrementUsage = useUserStore((s) => s.incrementUsage);

  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    isGenerating,
    generationProgress,
    generatePoster,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
      generatePoster: state.generatePoster,
    }))
  );

  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  const isDisabled = !isValid || isGenerating;

  const handleClick = async () => {
    if (isDisabled) return;

    try {
      const result = await generatePoster();

      // Check if this is the user's first poster
      if (postersThisMonth === 0) {
        // Show celebration (don't increment usage yet - dismiss will do it)
        triggerCelebration({
          imageUrl: result.imageUrl,
          posterId: result.posterId,
        });
      } else {
        // Normal flow: increment usage and navigate
        incrementUsage();
        router.push('/dashboard');
      }
    } catch (error) {
      // TODO: Show error toast
      console.error('Generation failed:', error);
    }
  };

  const buttonContent = isGenerating ? (
    <div className="flex items-center gap-3">
      <Loader2 data-testid="loading-spinner" className="h-5 w-5 animate-spin" />
      <span>Generating...</span>
      <span className="ml-1 font-mono text-gold-400">{generationProgress}%</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5" />
      <span>Generate Poster</span>
      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </div>
  );

  const button = (
    <div data-tour="generate-button">
      <Button
        size="xl"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'group w-full',
          isValid && !isGenerating && 'animate-pulse-gold'
        )}
      >
        {buttonContent}
      </Button>
    </div>
  );

  // Wrap disabled button in tooltip
  if (!isValid && !isGenerating) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="block w-full">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="border-surface-700 bg-surface-800 text-white"
          >
            <p className="text-sm">Complete all required fields to generate</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
```

### Step 4: Run tests to verify they pass

Run: `cd apps/web && pnpm test generate-button.test.tsx`

Expected: PASS

### Step 5: Commit

```bash
git add apps/web/components/builder/poster-builder-form/generate-button.tsx apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx
git commit -m "feat(builder): integrate FirstPosterCelebration in GenerateButton"
```

---

## Task 6: Render FirstPosterCelebration in PosterBuilderForm

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`

### Step 1: Add the component

Update imports and add component to JSX:

```tsx
// Add to imports
import { GuidedTooltips, useBuilderTour, FirstPosterCelebration } from '@/components/onboarding';

// Add after PreviewModal in the JSX (before GuidedTooltips)
      {/* First Poster Celebration Modal */}
      <FirstPosterCelebration />
```

### Step 2: Run type check

Run: `cd apps/web && pnpm type-check`

Expected: No errors

### Step 3: Commit

```bash
git add apps/web/components/builder/poster-builder-form/poster-builder-form.tsx
git commit -m "feat(builder): render FirstPosterCelebration modal"
```

---

## Task 7: Run Full Test Suite and Lint

### Step 1: Run all tests

Run: `cd apps/web && pnpm test`

Expected: All tests PASS

### Step 2: Run lint

Run: `pnpm lint`

Expected: No errors

### Step 3: Run type check

Run: `pnpm type-check`

Expected: No errors

### Step 4: Final commit if any fixes needed

```bash
git add -A
git commit -m "fix: address lint and type issues"
```

---

## Summary

| Task | Files | Tests |
|------|-------|-------|
| 1 | use-first-poster-celebration.ts | 5 tests |
| 2 | analytics.ts | N/A (types only) |
| 3 | first-poster-celebration.tsx | 11 tests |
| 4 | onboarding/index.ts | N/A (exports only) |
| 5 | generate-button.tsx | 1+ tests |
| 6 | poster-builder-form.tsx | N/A (render only) |
| 7 | Full suite | All existing + new |

Total new tests: ~17
