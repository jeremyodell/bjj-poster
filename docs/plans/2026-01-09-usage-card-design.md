# UsageCard Component Design (ODE-72)

## Summary

Standalone `UsageCard` component displaying poster quota with visual progress bar, color-coded thresholds, and upgrade CTA for free users approaching their limit.

## Decisions

| Decision | Choice |
|----------|--------|
| Component structure | Standalone `UsageCard`, used by `WelcomeSection` |
| Existing code | Refactor `WelcomeSection` to use `UsageCard` |
| Color thresholds | Green 0-50%, Yellow 50-80%, Red 80-100% |
| Upgrade CTA trigger | Free users at 80%+ usage |
| Messaging tone | Match existing premium/minimal app style |

## Component Structure

**File:** `apps/web/components/dashboard/usage-card.tsx`

```typescript
interface UsageCardProps {
  className?: string;
}
```

- Reads `postersThisMonth`, `postersLimit`, `subscriptionTier` from `useUserStore`
- Uses `useShallow` for optimal re-renders
- Exported via `components/dashboard/index.ts`

## Color Logic

```typescript
const YELLOW_THRESHOLD = 50;
const RED_THRESHOLD = 80;

const getProgressColor = (percentage: number, isAtLimit: boolean): string => {
  if (isAtLimit) return 'bg-red-500';
  if (percentage >= RED_THRESHOLD) return 'bg-red-500';
  if (percentage >= YELLOW_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
};
```

## Tier Messaging

| Tier | State | Display | Subtext |
|------|-------|---------|---------|
| Free | Under 80% | `2 / 3` | "posters used" |
| Free | 80%+ | `2 / 3` | "posters used · Upgrade for more" + CTA |
| Free | At limit | `3 / 3` | "limit reached" + CTA |
| Pro | Any | `8 / 20` | "posters used · 12 remaining" |
| Premium | Any | Crown + `UNLIMITED` | "Create as many posters as you want" |

## Visual Design

- Card: `rounded-xl border border-surface-800 bg-surface-900/50 p-6`
- Progress bar: `h-2 max-w-xs rounded-full bg-surface-800` with animated fill
- Numbers: `font-display text-4xl text-white`
- Premium: Gold accent (`text-gold-500`) with Crown icon

## Accessibility

- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` with plain text usage description
- Icons have `aria-hidden="true"`

## Integration

`WelcomeSection` changes:
- Remove inline usage display (~50 lines)
- Import `UsageCard`
- Render `<UsageCard />` after welcome header

## Test Cases

1. Progress bar fill accuracy (0%, 33%, 100%)
2. Color changes at thresholds (green/yellow/red)
3. Upgrade CTA visibility (free 80%+ only)
4. Tier-specific messaging
5. Zustand store integration

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/dashboard/usage-card.tsx` | Create |
| `components/dashboard/__tests__/usage-card.test.tsx` | Create |
| `components/dashboard/welcome-section.tsx` | Modify (use UsageCard) |
| `components/dashboard/__tests__/welcome-section.test.tsx` | Modify (update tests) |
| `components/dashboard/index.ts` | Modify (export UsageCard) |
