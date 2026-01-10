# Quota Limit Modal Design

## Overview

Build a blocking modal for free users who've hit their monthly poster quota (3 posters). The modal celebrates their creations, shows upgrade benefits, and provides two exit paths: upgrade to Pro or return to dashboard.

## Component Architecture

### File Structure

```
apps/web/components/quota/
├── quota-limit-modal.tsx      # The modal UI
├── use-quota-gate.ts          # Hook for quota gating logic
├── index.ts                   # Barrel exports
└── __tests__/
    ├── quota-limit-modal.test.tsx
    └── use-quota-gate.test.ts
```

### 1. QuotaLimitModal (Presentational Component)

**Props:**

```typescript
interface QuotaLimitModalProps {
  open: boolean
  posters: Poster[]
  onUpgrade: () => void
  onMaybeLater: () => void
}
```

**Layout (top to bottom):**

1. **Header** - "🎉 You've created X awesome posters this month!"
2. **Poster Gallery** - Horizontal row of thumbnails (~80x100px each)
3. **Subheading** - "Ready for more?"
4. **UpgradePrompt** - Reuses existing component with `variant="card"`, `targetTier="pro"`
5. **Alternative text** - "Or wait until [Month Day] for X more free posters"
6. **Maybe Later button** - Secondary button, navigates to dashboard

**Non-dismissible behavior:**

- `onEscapeKeyDown={(e) => e.preventDefault()}`
- `onPointerDownOutside={(e) => e.preventDefault()}`
- `onInteractOutside={(e) => e.preventDefault()}`
- No X close button

### 2. useQuotaGate Hook

**Interface:**

```typescript
interface UseQuotaGateOptions {
  posters: Poster[]
}

interface UseQuotaGateReturn {
  isBlocked: boolean
  showModal: boolean
  handleUpgrade: () => void
  handleMaybeLater: () => void
}
```

**Logic:**

1. Read `canCreatePoster()` and `subscriptionTier` from `useUserStore`
2. `isBlocked = !canCreatePoster() && subscriptionTier === 'free'`
3. `showModal = isBlocked`
4. `handleUpgrade` → track event, navigate to `/pricing`
5. `handleMaybeLater` → track event, navigate to `/dashboard`

**Usage:**

```tsx
function CreatePosterPage() {
  const { posters } = useUserPosters()
  const { showModal, handleUpgrade, handleMaybeLater } = useQuotaGate({ posters })

  return (
    <>
      <QuotaLimitModal
        open={showModal}
        posters={posters}
        onUpgrade={handleUpgrade}
        onMaybeLater={handleMaybeLater}
      />
      <PosterBuilder />
    </>
  )
}
```

## Date Calculation

Next reset date uses simple first-of-next-month logic:

```typescript
function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}
```

## Required Modification to UpgradePrompt

Add optional custom click handler for CTA:

```typescript
interface UpgradePromptProps {
  // ... existing props
  onCtaClick?: () => void  // Optional custom handler
  ctaHref?: string         // Defaults to '/pricing'
}
```

When `onCtaClick` is provided, the button calls it instead of navigating. Backward-compatible.

## Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `quota_limit_modal_viewed` | `{ postersCount, tier }` | Modal opens |
| `quota_limit_upgrade_clicked` | `{ source: 'quota_modal' }` | Upgrade clicked |
| `quota_limit_maybe_later_clicked` | `{ nextResetDate }` | Maybe Later clicked |

## Test Plan

### quota-limit-modal.test.tsx

- Renders header with correct poster count
- Renders poster thumbnails
- Renders UpgradePrompt card
- Shows correct next month date
- Calls onUpgrade when upgrade clicked
- Calls onMaybeLater when button clicked
- Cannot be dismissed via ESC key
- Cannot be dismissed via outside click

### use-quota-gate.test.ts

- Returns `isBlocked: true` when quota exceeded and tier is free
- Returns `isBlocked: false` when quota exceeded but tier is pro/premium
- Returns `isBlocked: false` when quota not exceeded
- `handleUpgrade` tracks event and navigates
- `handleMaybeLater` tracks event and navigates to dashboard

## Edge Cases

1. **Empty posters array** - Show "You've hit your monthly limit" instead of count
2. **December edge case** - Dec 31 correctly shows "Jan 1" for next reset
3. **Mid-session upgrade** - `isBlocked` recalculates via Zustand subscription

## Dependencies

- `UpgradePrompt` component (UI-SUB-001) - ✅ Complete
- `useUserStore` with `canCreatePoster()` - ✅ Exists
- `Poster` type from `@/lib/types/api` - ✅ Exists
