# QuotaLimitModal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a blocking modal that shows when free users hit their poster quota, displaying their creations and an upgrade path.

**Architecture:** Create `QuotaLimitModal` presentational component + `useQuotaGate` hook. The modal is non-dismissible (no ESC/outside click). Uses existing `UpgradePrompt` component with a new optional `onCtaClick` prop.

**Tech Stack:** React, TypeScript, Radix Dialog, Zustand, Vitest, React Testing Library

---

## Task 1: Add onCtaClick prop to UpgradePrompt

**Files:**
- Modify: `apps/web/components/upgrade/upgrade-prompt.tsx`
- Modify: `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`

### Step 1.1: Write failing test for onCtaClick

Add to `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`:

```typescript
it('calls onCtaClick instead of navigating when provided', async () => {
  const onCtaClick = vi.fn()
  const user = userEvent.setup()

  render(
    <UpgradePrompt
      variant="card"
      targetTier="pro"
      source="quota_modal"
      onCtaClick={onCtaClick}
    />
  )

  await user.click(screen.getByRole('button', { name: /upgrade now/i }))

  expect(onCtaClick).toHaveBeenCalledTimes(1)
})
```

### Step 1.2: Run test to verify it fails

```bash
pnpm test apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
```

Expected: FAIL - onCtaClick prop doesn't exist

### Step 1.3: Update UpgradePromptProps interface

In `apps/web/components/upgrade/upgrade-prompt.tsx`, update the interface:

```typescript
export interface UpgradePromptProps {
  variant: UpgradePromptVariant
  targetTier: TargetTier
  source: string
  onDismiss?: () => void
  onCtaClick?: () => void
}
```

### Step 1.4: Update component to use onCtaClick

For banner variant, replace the CTA Link with conditional rendering:

```typescript
{onCtaClick ? (
  <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-surface-950" onClick={() => { handleCtaClick(); onCtaClick(); }}>
    Upgrade Now
  </Button>
) : (
  <Button asChild size="sm" className="bg-gold-500 hover:bg-gold-600 text-surface-950">
    <Link href="/pricing" onClick={handleCtaClick}>
      Upgrade Now
    </Link>
  </Button>
)}
```

Apply same pattern to card and modal variants.

### Step 1.5: Run test to verify it passes

```bash
pnpm test apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
```

Expected: PASS

### Step 1.6: Commit

```bash
git add apps/web/components/upgrade/upgrade-prompt.tsx apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
git commit -m "feat(upgrade): add onCtaClick prop to UpgradePrompt"
```

---

## Task 2: Create date utility for next reset date

**Files:**
- Create: `apps/web/components/quota/get-next-reset-date.ts`
- Create: `apps/web/components/quota/__tests__/get-next-reset-date.test.ts`

### Step 2.1: Write failing tests

Create `apps/web/components/quota/__tests__/get-next-reset-date.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getNextResetDate, formatResetDate } from '../get-next-reset-date'

describe('getNextResetDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns first day of next month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))

    const result = getNextResetDate()

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(1) // February (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it('handles December correctly (rolls to January)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-25'))

    const result = getNextResetDate()

    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(0) // January
    expect(result.getDate()).toBe(1)
  })
})

describe('formatResetDate', () => {
  it('formats date as "Month Day"', () => {
    const date = new Date('2026-02-01')
    expect(formatResetDate(date)).toBe('February 1')
  })

  it('formats January correctly', () => {
    const date = new Date('2027-01-01')
    expect(formatResetDate(date)).toBe('January 1')
  })
})
```

### Step 2.2: Run test to verify it fails

```bash
pnpm test apps/web/components/quota/__tests__/get-next-reset-date.test.ts
```

Expected: FAIL - module not found

### Step 2.3: Implement the utility

Create `apps/web/components/quota/get-next-reset-date.ts`:

```typescript
export function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

export function formatResetDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
```

### Step 2.4: Run test to verify it passes

```bash
pnpm test apps/web/components/quota/__tests__/get-next-reset-date.test.ts
```

Expected: PASS

### Step 2.5: Commit

```bash
git add apps/web/components/quota/
git commit -m "feat(quota): add date utility for next reset date"
```

---

## Task 3: Create QuotaLimitModal component

**Files:**
- Create: `apps/web/components/quota/quota-limit-modal.tsx`
- Create: `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`

### Step 3.1: Write failing tests for modal rendering

Create `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuotaLimitModal } from '../quota-limit-modal'
import type { Poster } from '@/lib/types/api'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>{children}</a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const mockPosters: Poster[] = [
  {
    id: 'poster-1',
    templateId: 'template-1',
    createdAt: '2026-01-05T12:00:00Z',
    thumbnailUrl: 'https://example.com/poster1.jpg',
    athleteName: 'John Doe',
    tournament: 'IBJJF Worlds',
    beltRank: 'purple',
    status: 'completed',
  },
  {
    id: 'poster-2',
    templateId: 'template-2',
    createdAt: '2026-01-08T14:00:00Z',
    thumbnailUrl: 'https://example.com/poster2.jpg',
    athleteName: 'Jane Smith',
    tournament: 'Pans',
    beltRank: 'brown',
    status: 'completed',
  },
]

describe('QuotaLimitModal', () => {
  const defaultProps = {
    open: true,
    posters: mockPosters,
    onUpgrade: vi.fn(),
    onMaybeLater: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders celebration header with poster count', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText(/you've created 2 awesome posters this month/i)).toBeInTheDocument()
  })

  it('renders poster thumbnails', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/poster1.jpg')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/poster2.jpg')
  })

  it('renders "Ready for more?" subheading', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText(/ready for more/i)).toBeInTheDocument()
  })

  it('renders UpgradePrompt card', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
    expect(screen.getByText('20 posters/month')).toBeInTheDocument()
  })

  it('renders alternative text with next month date', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText(/or wait until February 1 for 3 more free posters/i)).toBeInTheDocument()
  })

  it('renders Maybe Later button', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByRole('button', { name: /maybe later/i })).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<QuotaLimitModal {...defaultProps} open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

### Step 3.2: Run test to verify it fails

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: FAIL - module not found

### Step 3.3: Implement QuotaLimitModal component

Create `apps/web/components/quota/quota-limit-modal.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UpgradePrompt } from '@/components/upgrade'
import { track } from '@/lib/analytics'
import { getNextResetDate, formatResetDate } from './get-next-reset-date'
import type { Poster } from '@/lib/types/api'

export interface QuotaLimitModalProps {
  open: boolean
  posters: Poster[]
  onUpgrade: () => void
  onMaybeLater: () => void
}

const FREE_TIER_LIMIT = 3

export function QuotaLimitModal({
  open,
  posters,
  onUpgrade,
  onMaybeLater,
}: QuotaLimitModalProps) {
  const posterCount = posters.length
  const nextResetDate = getNextResetDate()
  const formattedDate = formatResetDate(nextResetDate)

  useEffect(() => {
    if (open) {
      track('quota_limit_modal_viewed', { postersCount: posterCount, tier: 'free' })
    }
  }, [open, posterCount])

  const handleUpgrade = () => {
    track('quota_limit_upgrade_clicked', { source: 'quota_modal' })
    onUpgrade()
  }

  const handleMaybeLater = () => {
    track('quota_limit_maybe_later_clicked', { nextResetDate: formattedDate })
    onMaybeLater()
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Prevent closing via dialog state change
      }}
    >
      <DialogContent
        className="border-surface-700 bg-surface-900 sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display">
            🎉 You've created {posterCount} awesome posters this month!
          </DialogTitle>
        </DialogHeader>

        {/* Poster Gallery */}
        <div className="flex justify-center gap-3 py-4">
          {posters.slice(0, 3).map((poster) => (
            <div
              key={poster.id}
              className="relative h-24 w-20 overflow-hidden rounded-lg border border-surface-700 shadow-lg"
            >
              <Image
                src={poster.thumbnailUrl}
                alt={`${poster.athleteName} poster`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <DialogDescription className="text-center text-lg text-surface-200">
          Ready for more?
        </DialogDescription>

        {/* Upgrade Prompt */}
        <div className="my-4">
          <UpgradePrompt
            variant="card"
            targetTier="pro"
            source="quota_modal"
            onCtaClick={handleUpgrade}
          />
        </div>

        {/* Alternative Option */}
        <p className="text-center text-sm text-surface-400">
          Or wait until {formattedDate} for {FREE_TIER_LIMIT} more free posters
        </p>

        {/* Maybe Later */}
        <Button
          variant="ghost"
          className="w-full text-surface-400 hover:text-surface-200"
          onClick={handleMaybeLater}
        >
          Maybe Later
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 3.4: Run test to verify it passes

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: PASS

### Step 3.5: Commit

```bash
git add apps/web/components/quota/quota-limit-modal.tsx apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
git commit -m "feat(quota): add QuotaLimitModal component"
```

---

## Task 4: Test modal button callbacks

**Files:**
- Modify: `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`

### Step 4.1: Write tests for button callbacks

Add to the test file:

```typescript
describe('button callbacks', () => {
  it('calls onUpgrade when upgrade button clicked', async () => {
    const onUpgrade = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={onUpgrade}
        onMaybeLater={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /upgrade now/i }))

    expect(onUpgrade).toHaveBeenCalledTimes(1)
  })

  it('calls onMaybeLater when Maybe Later clicked', async () => {
    const onMaybeLater = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={onMaybeLater}
      />
    )

    await user.click(screen.getByRole('button', { name: /maybe later/i }))

    expect(onMaybeLater).toHaveBeenCalledTimes(1)
  })
})
```

### Step 4.2: Run tests

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: PASS

### Step 4.3: Commit

```bash
git add apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
git commit -m "test(quota): add button callback tests for QuotaLimitModal"
```

---

## Task 5: Test modal non-dismissibility

**Files:**
- Modify: `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`

### Step 5.1: Write tests for non-dismissibility

Add to the test file:

```typescript
describe('non-dismissibility', () => {
  it('cannot be dismissed via ESC key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    // Modal should still be present
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not have a close X button', () => {
    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    // The default DialogContent includes a close button with sr-only "Close" text
    // Our modal should not have it (or it should be hidden)
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })
})
```

### Step 5.2: Run test to check if it fails

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

If the close button test fails, we need to modify the DialogContent to hide the close button.

### Step 5.3: Update modal to hide close button (if needed)

The default `DialogContent` includes a close button. We need to create a custom version or pass a prop. Add `hideCloseButton` logic or use the `DialogPrimitive.Content` directly. If the existing DialogContent doesn't support this, update the component:

```typescript
// In quota-limit-modal.tsx, use DialogPrimitive directly or add a wrapper
<DialogContent
  className="border-surface-700 bg-surface-900 sm:max-w-lg [&>button]:hidden"
  // ... rest of props
>
```

The `[&>button]:hidden` Tailwind selector hides the default close button.

### Step 5.4: Run tests

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: PASS

### Step 5.5: Commit

```bash
git add apps/web/components/quota/
git commit -m "test(quota): verify QuotaLimitModal is non-dismissible"
```

---

## Task 6: Create useQuotaGate hook

**Files:**
- Create: `apps/web/components/quota/use-quota-gate.ts`
- Create: `apps/web/components/quota/__tests__/use-quota-gate.test.ts`

### Step 6.1: Write failing tests for hook

Create `apps/web/components/quota/__tests__/use-quota-gate.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuotaGate } from '../use-quota-gate'
import { useUserStore } from '@/lib/stores'
import type { Poster } from '@/lib/types/api'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

const mockPosters: Poster[] = [
  {
    id: 'poster-1',
    templateId: 'template-1',
    createdAt: '2026-01-05T12:00:00Z',
    thumbnailUrl: 'https://example.com/poster1.jpg',
    athleteName: 'John Doe',
    tournament: 'IBJJF Worlds',
    beltRank: 'purple',
    status: 'completed',
  },
]

describe('useQuotaGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    act(() => {
      useUserStore.setState({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
        subscriptionTier: 'free',
        postersThisMonth: 0,
        postersLimit: 3,
      })
    })
  })

  describe('isBlocked', () => {
    it('returns false when under quota', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 2, postersLimit: 3 })
      })

      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      expect(result.current.isBlocked).toBe(false)
    })

    it('returns true when at quota and tier is free', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        })
      })

      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      expect(result.current.isBlocked).toBe(true)
    })

    it('returns false when at quota but tier is pro', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 20,
          postersLimit: 20,
        })
      })

      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      expect(result.current.isBlocked).toBe(false)
    })

    it('returns false when tier is premium regardless of usage', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'premium',
          postersThisMonth: 100,
          postersLimit: -1,
        })
      })

      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      expect(result.current.isBlocked).toBe(false)
    })
  })

  describe('showModal', () => {
    it('equals isBlocked value', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        })
      })

      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      expect(result.current.showModal).toBe(true)
      expect(result.current.showModal).toBe(result.current.isBlocked)
    })
  })

  describe('handleUpgrade', () => {
    it('navigates to /pricing', () => {
      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      act(() => {
        result.current.handleUpgrade()
      })

      expect(mockPush).toHaveBeenCalledWith('/pricing')
    })
  })

  describe('handleMaybeLater', () => {
    it('navigates to /dashboard', () => {
      const { result } = renderHook(() => useQuotaGate({ posters: mockPosters }))

      act(() => {
        result.current.handleMaybeLater()
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})
```

### Step 6.2: Run test to verify it fails

```bash
pnpm test apps/web/components/quota/__tests__/use-quota-gate.test.ts
```

Expected: FAIL - module not found

### Step 6.3: Implement useQuotaGate hook

Create `apps/web/components/quota/use-quota-gate.ts`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores'
import type { Poster } from '@/lib/types/api'

export interface UseQuotaGateOptions {
  posters: Poster[]
}

export interface UseQuotaGateReturn {
  isBlocked: boolean
  showModal: boolean
  handleUpgrade: () => void
  handleMaybeLater: () => void
}

export function useQuotaGate({ posters }: UseQuotaGateOptions): UseQuotaGateReturn {
  const router = useRouter()
  const canCreatePoster = useUserStore((state) => state.canCreatePoster())
  const subscriptionTier = useUserStore((state) => state.subscriptionTier)

  const isBlocked = !canCreatePoster && subscriptionTier === 'free'
  const showModal = isBlocked

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const handleMaybeLater = () => {
    router.push('/dashboard')
  }

  return {
    isBlocked,
    showModal,
    handleUpgrade,
    handleMaybeLater,
  }
}
```

### Step 6.4: Run test to verify it passes

```bash
pnpm test apps/web/components/quota/__tests__/use-quota-gate.test.ts
```

Expected: PASS

### Step 6.5: Commit

```bash
git add apps/web/components/quota/use-quota-gate.ts apps/web/components/quota/__tests__/use-quota-gate.test.ts
git commit -m "feat(quota): add useQuotaGate hook"
```

---

## Task 7: Create barrel exports

**Files:**
- Create: `apps/web/components/quota/index.ts`

### Step 7.1: Create index.ts

Create `apps/web/components/quota/index.ts`:

```typescript
export { QuotaLimitModal, type QuotaLimitModalProps } from './quota-limit-modal'
export { useQuotaGate, type UseQuotaGateOptions, type UseQuotaGateReturn } from './use-quota-gate'
export { getNextResetDate, formatResetDate } from './get-next-reset-date'
```

### Step 7.2: Verify types and exports

```bash
pnpm type-check
```

Expected: PASS

### Step 7.3: Commit

```bash
git add apps/web/components/quota/index.ts
git commit -m "feat(quota): add barrel exports"
```

---

## Task 8: Run full test suite and lint

**Files:** None (validation only)

### Step 8.1: Run all tests

```bash
pnpm test
```

Expected: All tests pass

### Step 8.2: Run linter

```bash
pnpm lint
```

Expected: No errors

### Step 8.3: Run type check

```bash
pnpm type-check
```

Expected: No errors

### Step 8.4: Final commit if any fixes needed

```bash
git add -A
git commit -m "fix(quota): address lint and type issues"
```

---

## Task 9: Analytics event tests

**Files:**
- Modify: `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`

### Step 9.1: Add analytics tests

Add to the test file:

```typescript
import { track } from '@/lib/analytics'

describe('analytics', () => {
  it('tracks quota_limit_modal_viewed on mount', () => {
    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    expect(track).toHaveBeenCalledWith('quota_limit_modal_viewed', {
      postersCount: 2,
      tier: 'free',
    })
  })

  it('tracks quota_limit_upgrade_clicked on upgrade', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /upgrade now/i }))

    expect(track).toHaveBeenCalledWith('quota_limit_upgrade_clicked', {
      source: 'quota_modal',
    })
  })

  it('tracks quota_limit_maybe_later_clicked with next reset date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <QuotaLimitModal
        open={true}
        posters={mockPosters}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /maybe later/i }))

    expect(track).toHaveBeenCalledWith('quota_limit_maybe_later_clicked', {
      nextResetDate: 'February 1',
    })
  })
})
```

### Step 9.2: Run tests

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: PASS

### Step 9.3: Commit

```bash
git add apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
git commit -m "test(quota): add analytics event tests"
```

---

## Task 10: Edge case - empty posters array

**Files:**
- Modify: `apps/web/components/quota/__tests__/quota-limit-modal.test.tsx`
- Modify: `apps/web/components/quota/quota-limit-modal.tsx`

### Step 10.1: Write failing test for empty posters

Add to the test file:

```typescript
describe('edge cases', () => {
  it('shows generic message when posters array is empty', () => {
    render(
      <QuotaLimitModal
        open={true}
        posters={[]}
        onUpgrade={vi.fn()}
        onMaybeLater={vi.fn()}
      />
    )

    expect(screen.getByText(/you've hit your monthly limit/i)).toBeInTheDocument()
  })
})
```

### Step 10.2: Run test to verify it fails

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: FAIL

### Step 10.3: Update component to handle empty posters

In `quota-limit-modal.tsx`, update the header:

```typescript
<DialogTitle className="text-center text-2xl font-display">
  {posterCount > 0
    ? `🎉 You've created ${posterCount} awesome posters this month!`
    : `🎉 You've hit your monthly limit!`}
</DialogTitle>
```

And conditionally render the gallery:

```typescript
{posters.length > 0 && (
  <div className="flex justify-center gap-3 py-4">
    {posters.slice(0, 3).map((poster) => (
      // ... existing code
    ))}
  </div>
)}
```

### Step 10.4: Run test to verify it passes

```bash
pnpm test apps/web/components/quota/__tests__/quota-limit-modal.test.tsx
```

Expected: PASS

### Step 10.5: Commit

```bash
git add apps/web/components/quota/
git commit -m "fix(quota): handle empty posters array gracefully"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add onCtaClick to UpgradePrompt | upgrade-prompt.tsx |
| 2 | Create date utility | get-next-reset-date.ts |
| 3 | Create QuotaLimitModal | quota-limit-modal.tsx |
| 4 | Test button callbacks | quota-limit-modal.test.tsx |
| 5 | Test non-dismissibility | quota-limit-modal.test.tsx |
| 6 | Create useQuotaGate hook | use-quota-gate.ts |
| 7 | Create barrel exports | index.ts |
| 8 | Run full test suite | - |
| 9 | Analytics event tests | quota-limit-modal.test.tsx |
| 10 | Edge case: empty posters | quota-limit-modal.tsx |
