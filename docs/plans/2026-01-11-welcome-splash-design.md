# Welcome Splash Screen Design

**Issue:** ODE-78 - UI-ONB-001: Welcome Splash Screen
**Date:** 2026-01-11

## Summary

Create a welcome splash screen for first-time users with product overview and example posters. Shows only once per user (tracked via localStorage).

## Component Structure

**File:** `apps/web/components/onboarding/welcome-splash.tsx`
**Hook:** `apps/web/components/onboarding/use-welcome-splash.ts`

### Integration

Added to `apps/web/app/dashboard/page.tsx` at the top:

```tsx
export default function DashboardPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <WelcomeSplash />
      <UpgradeSuccessHandler />
      ...
    </main>
  );
}
```

### Component Behavior

- On mount, checks `localStorage.getItem('hasSeenWelcome')`
- If `null` or not `'true'`, renders full-screen overlay
- User must click CTA or skip to dismiss (no auto-dismiss)
- On dismiss, sets `localStorage.setItem('hasSeenWelcome', 'true')`
- CTA navigates to `/builder`, skip stays on dashboard

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                  Full-screen overlay                │
│                  (dark background)                  │
│                                                     │
│              ┌─────────────────────┐                │
│              │   🥋 BJJ Poster     │                │
│              │      Builder        │                │
│              │                     │                │
│              │  "Create Tournament │                │
│              │  Posters in 3 Steps"│                │
│              │                     │                │
│              │  ┌───┐ ┌───┐ ┌───┐  │                │
│              │  │ 1 │ │ 2 │ │ 3 │  │  ← 3 posters   │
│              │  └───┘ └───┘ └───┘  │                │
│              │                     │                │
│              │  ✓ No design skills │                │
│              │  ✓ Professional     │                │
│              │  ✓ Share instantly  │                │
│              │                     │                │
│              │ [Create My First →] │  ← Primary CTA │
│              │                     │                │
│              │  Skip to Dashboard  │  ← Text link   │
│              └─────────────────────┘                │
│                   max-width: 600px                  │
└─────────────────────────────────────────────────────┘
```

### Styling

- **Overlay:** `fixed inset-0 z-[100] bg-surface-900/95 backdrop-blur-sm`
- **Content:** `max-w-xl` centered with flexbox
- **Poster placeholders:** Aspect ratio boxes with gradient backgrounds
- **Primary button:** Existing `Button` component, full width
- **Skip link:** `text-surface-400 hover:text-white`
- **Responsive:** Content scrollable on mobile, images shrink/stack

## State Management

### Hook: `useWelcomeSplash`

```tsx
export function useWelcomeSplash() {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    setShowSplash(hasSeenWelcome !== 'true');
    setIsLoading(false);
  }, []);

  const dismiss = (navigateTo: 'builder' | 'dashboard') => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowSplash(false);
    if (navigateTo === 'builder') {
      router.push('/builder');
    }
  };

  return { showSplash, isLoading, dismiss };
}
```

**Why `isLoading`?** Prevents hydration mismatch - localStorage only available client-side.

## Testing

**Test file:** `apps/web/components/onboarding/__tests__/welcome-splash.test.tsx`

### Test Cases

1. Shows splash on first visit (localStorage empty)
2. Hides splash on subsequent visits (localStorage has 'true')
3. "Create My First Poster" navigates to `/builder`
4. "Skip to Dashboard" closes overlay without navigation
5. Sets localStorage flag on CTA click
6. Sets localStorage flag on skip click
7. Responsive layout renders correctly

### Mocking Strategy

- Mock `localStorage` via `jest.spyOn(Storage.prototype, ...)`
- Mock `next/navigation` router
- Use `@testing-library/react` for rendering and interactions

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auto-dismiss | No | Deliberate onboarding, user must interact |
| Poster images | Placeholders | Real assets can be swapped later |
| Dialog vs custom | Custom overlay | Full control, no accidental dismiss |
| State location | Custom hook | Clean separation, testable |

## Files to Create/Modify

- `apps/web/components/onboarding/welcome-splash.tsx` (new)
- `apps/web/components/onboarding/use-welcome-splash.ts` (new)
- `apps/web/components/onboarding/index.ts` (new, barrel export)
- `apps/web/components/onboarding/__tests__/welcome-splash.test.tsx` (new)
- `apps/web/components/onboarding/__tests__/use-welcome-splash.test.ts` (new)
- `apps/web/app/dashboard/page.tsx` (modify - add WelcomeSplash)
