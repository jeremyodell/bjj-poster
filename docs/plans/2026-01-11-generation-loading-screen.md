# Generation Loading Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an engaging full-screen loading overlay for poster generation with animated progress tracking, rotating tips, and dynamic time estimates.

**Architecture:** Single presentational component `GenerationLoadingScreen` rendered conditionally in `PosterBuilderForm` when `isGenerating === true`. Uses CSS animations (no new dependencies). Component manages its own timer state for tip rotation and elapsed time tracking.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, React Testing Library

---

## Task 1: Create GenerationLoadingScreen Component Skeleton

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`
- Create: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`

**Step 1: Write the failing test for basic render**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerationLoadingScreen } from '../generation-loading-screen';

describe('GenerationLoadingScreen', () => {
  it('renders loading screen with progress', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL with "Cannot find module '../generation-loading-screen'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        <span className="font-mono text-lg text-gold-400">{progress}%</span>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx
git commit -m "feat(builder): add GenerationLoadingScreen skeleton"
```

---

## Task 2: Add Belt Animation

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Write the failing test for belt icon**

```typescript
// Add to existing test file
it('renders belt animation icon', () => {
  render(<GenerationLoadingScreen progress={0} />);

  expect(screen.getByTestId('belt-animation')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL with "Unable to find an element by: [data-testid="belt-animation"]"

**Step 3: Update implementation with belt icon**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { Award } from 'lucide-react';

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress percentage */}
        <span className="font-mono text-lg text-gold-400">{progress}%</span>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): add belt animation to loading screen"
```

---

## Task 3: Add Progress Bar

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Write the failing test for progress bar**

```typescript
// Add to existing test file
it('renders progress bar with correct width', () => {
  render(<GenerationLoadingScreen progress={75} />);

  const progressBar = screen.getByRole('progressbar');
  expect(progressBar).toHaveAttribute('aria-valuenow', '75');

  const progressFill = screen.getByTestId('progress-fill');
  expect(progressFill).toHaveStyle({ width: '75%' });
});

it('renders progress bar at 0%', () => {
  render(<GenerationLoadingScreen progress={0} />);

  const progressBar = screen.getByRole('progressbar');
  expect(progressBar).toHaveAttribute('aria-valuenow', '0');
});

it('renders progress bar at 100%', () => {
  render(<GenerationLoadingScreen progress={100} />);

  const progressBar = screen.getByRole('progressbar');
  expect(progressBar).toHaveAttribute('aria-valuenow', '100');
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL with "Unable to find an accessible element with the role "progressbar""

**Step 3: Update implementation with progress bar**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { Award } from 'lucide-react';

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="text-right">
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): add progress bar to loading screen"
```

---

## Task 4: Add Rotating Tips

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Write the failing test for initial tip display**

```typescript
// Add to existing test file
it('displays a tip on initial render', () => {
  render(<GenerationLoadingScreen progress={50} />);

  // Should show the first tip
  expect(screen.getByText(/pro tip|did you know|upgrade to pro|premium users/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL with "Unable to find an element with the text"

**Step 3: Add tips constant and initial display**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { useState } from 'react';
import { Award } from 'lucide-react';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="mb-6 text-right">
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div className="min-h-[3rem] px-4">
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): add initial tip display to loading screen"
```

---

## Task 5: Add Tip Rotation Timer

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Write the failing test for tip rotation**

```typescript
// Add imports at top of test file
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Add beforeEach/afterEach for timer mocking
describe('GenerationLoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ... existing tests ...

  it('rotates tips every 5 seconds', () => {
    render(<GenerationLoadingScreen progress={50} />);

    const firstTip = screen.getByText(/pro tip: remove backgrounds/i);
    expect(firstTip).toBeInTheDocument();

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should now show second tip
    expect(screen.getByText(/did you know\? pro users get hd/i)).toBeInTheDocument();

    // Advance another 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should now show third tip
    expect(screen.getByText(/upgrade to pro to remove watermarks/i)).toBeInTheDocument();
  });

  it('cycles tips back to first after last tip', () => {
    render(<GenerationLoadingScreen progress={50} />);

    // Advance through all 5 tips (25 seconds)
    act(() => {
      vi.advanceTimersByTime(25000);
    });

    // Should be back to first tip
    expect(screen.getByText(/pro tip: remove backgrounds/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL - tips don't rotate yet

**Step 3: Add useEffect for tip rotation**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="mb-6 text-right">
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div className="min-h-[3rem] px-4">
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): add tip rotation timer to loading screen"
```

---

## Task 6: Add Time Estimate Display

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Write the failing test for time estimate**

```typescript
// Add to existing test file
it('displays initial time estimate', () => {
  render(<GenerationLoadingScreen progress={0} />);

  expect(screen.getByText(/usually takes 15-20 seconds/i)).toBeInTheDocument();
});

it('updates time estimate after 20 seconds', () => {
  render(<GenerationLoadingScreen progress={50} />);

  expect(screen.getByText(/usually takes 15-20 seconds/i)).toBeInTheDocument();

  // Advance 20 seconds
  act(() => {
    vi.advanceTimersByTime(20000);
  });

  expect(screen.getByText(/almost done! a few more seconds/i)).toBeInTheDocument();
  expect(screen.queryByText(/usually takes 15-20 seconds/i)).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: FAIL with "Unable to find an element with the text: /usually takes 15-20 seconds/i"

**Step 3: Add elapsed time tracking and dynamic message**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeMessage =
    elapsedSeconds >= 20
      ? "Almost done! A few more seconds..."
      : "Usually takes 15-20 seconds";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="mb-6 text-right">
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div className="min-h-[3rem] px-4">
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Time Estimate */}
        <p className="mt-4 text-sm text-surface-400">
          {timeMessage}
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): add time estimate to loading screen"
```

---

## Task 7: Add Lightbulb Emoji to Tips

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

**Step 1: Update tips array with emoji prefix**

Update the TIPS constant to include lightbulb emoji as specified in the ticket:

```typescript
const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];
```

**Step 2: Run all tests to verify nothing broke**

Run: `cd apps/web && pnpm test generation-loading-screen`
Expected: PASS (tips tests use regex that match without emoji)

**Step 3: Commit**

```bash
git add -u
git commit -m "feat(builder): add lightbulb emoji to loading tips"
```

---

## Task 8: Integrate into PosterBuilderForm

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`

**Step 1: Write the failing integration test**

```typescript
// Add to apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx
// First, check if this test file exists and what mocks are already set up
// Add these tests:

it('shows loading screen when isGenerating is true', () => {
  // Mock store to return isGenerating: true
  mockUsePosterBuilderStore.mockImplementation((selector) =>
    selector({
      ...defaultStoreState,
      isGenerating: true,
      generationProgress: 45,
    })
  );

  render(<PosterBuilderForm />);

  expect(screen.getByRole('dialog', { name: /generating poster/i })).toBeInTheDocument();
  expect(screen.getByText('45%')).toBeInTheDocument();
});

it('hides loading screen when isGenerating is false', () => {
  // Mock store to return isGenerating: false
  mockUsePosterBuilderStore.mockImplementation((selector) =>
    selector({
      ...defaultStoreState,
      isGenerating: false,
      generationProgress: 0,
    })
  );

  render(<PosterBuilderForm />);

  expect(screen.queryByRole('dialog', { name: /generating poster/i })).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test poster-builder-form`
Expected: FAIL - loading screen not rendered

**Step 3: Update PosterBuilderForm to render loading screen**

```typescript
// apps/web/components/builder/poster-builder-form/poster-builder-form.tsx
'use client';

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  PhotoUploadZone,
  AthleteInfoFields,
  TournamentInfoFields,
  TemplateSelector,
} from '@/components/builder';
import { GuidedTooltips, useBuilderTour, FirstPosterCelebration } from '@/components/onboarding';
import { usePosterBuilderStore } from '@/lib/stores';
import { GenerateButton } from './generate-button';
import { FloatingPreviewButton } from './floating-preview-button';
import { PreviewModal } from './preview-modal';
import { GenerationLoadingScreen } from './generation-loading-screen';

export function PosterBuilderForm(): JSX.Element {
  const { showTour, isLoading, completeTour, skipTour } = useBuilderTour();
  const { initializeForFirstVisit, isGenerating, generationProgress } = usePosterBuilderStore(
    useShallow((state) => ({
      initializeForFirstVisit: state.initializeForFirstVisit,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
    }))
  );

  // Initialize sample data for first-time visitors
  useEffect(() => {
    if (showTour && !isLoading) {
      initializeForFirstVisit();
    }
  }, [showTour, isLoading, initializeForFirstVisit]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Photo Upload Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Upload Photo</h2>
        <PhotoUploadZone />
      </section>

      {/* Athlete Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Athlete Information</h2>
        <AthleteInfoFields />
      </section>

      {/* Tournament Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Tournament Details</h2>
        <TournamentInfoFields />
      </section>

      {/* Template Selection Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Choose Template</h2>
        <TemplateSelector />
      </section>

      {/* Generate Button - Sticky on mobile */}
      <div
        data-testid="generate-button-wrapper"
        className="sticky bottom-0 pt-4 pb-4 md:relative md:pt-0 bg-gradient-to-t from-primary-950 via-primary-950 to-transparent md:bg-none"
      >
        <GenerateButton />
      </div>

      {/* Floating Preview Button */}
      <FloatingPreviewButton />

      {/* Preview Modal */}
      <PreviewModal />

      {/* First Poster Celebration Modal */}
      <FirstPosterCelebration />

      {/* Generation Loading Screen */}
      {isGenerating && <GenerationLoadingScreen progress={generationProgress} />}

      {/* Guided Tour for First-Time Users */}
      {!isLoading && (
        <GuidedTooltips
          run={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test poster-builder-form`
Expected: PASS

**Step 5: Commit**

```bash
git add -u
git commit -m "feat(builder): integrate GenerationLoadingScreen into PosterBuilderForm"
```

---

## Task 9: Run Full Test Suite and Type Check

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: No errors

**Step 4: Commit if any fixes were needed**

```bash
git add -u
git commit -m "fix(builder): address lint/type issues in loading screen"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Component skeleton | Create component + test |
| 2 | Belt animation | Add Award icon with pulse |
| 3 | Progress bar | Add gradient progress bar |
| 4 | Initial tip display | Add TIPS array and display |
| 5 | Tip rotation | Add 5-second interval |
| 6 | Time estimate | Add elapsed time tracking |
| 7 | Emoji prefix | Add lightbulb to tips |
| 8 | Integration | Render in PosterBuilderForm |
| 9 | Verification | Run full test suite |
