# Generation Loading Screen Design

**Issue:** ODE-81 - UI-POL-001: Loading States & Animations
**Date:** 2026-01-11

## Summary

Create an engaging full-screen loading overlay for poster generation with animated progress tracking, rotating Pro feature tips, and dynamic time estimates.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Animation approach | CSS-only (no new dependencies) |
| Layout style | Centered card (matches FirstPosterCelebration) |
| BJJ-themed element | Belt icon with pulse animation |
| Progress bar style | Gold gradient bar |
| Tip transition | Fade crossfade |
| Render location | In PosterBuilderForm |

## Component Structure

**File:** `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`

```
GenerationLoadingScreen
├── Backdrop (fixed, full-screen, z-[1000], semi-transparent)
└── Card (centered, max-w-md)
    ├── Belt Animation (pulsing gold belt icon)
    ├── Progress Section
    │   ├── Progress Bar (gold gradient, 0-100%)
    │   └── Percentage Text
    ├── Rotating Tip (fade transition, 5s interval)
    └── Time Estimate ("Usually takes 15-20 seconds")
```

**Props:**
```typescript
interface GenerationLoadingScreenProps {
  progress: number;        // 0-100, from store
}
```

## Visual Design

### Backdrop
- `fixed inset-0 z-[1000]`
- `bg-surface-950/95 backdrop-blur-sm`
- `animate-fade-in` on mount

### Card
- `max-w-md w-full mx-4 p-8 rounded-2xl`
- `bg-surface-900 border border-surface-700 shadow-2xl`
- `animate-scale-in` on mount

### Belt Animation
- Lucide `Award` icon (or custom belt SVG)
- `h-16 w-16 text-gold-500`
- `animate-pulse-gold` (existing keyframe)
- Container with `animate-glow` for opacity pulse

### Progress Bar
- Outer: `h-2 w-full rounded-full bg-surface-800`
- Inner: `h-full rounded-full transition-all duration-300 ease-out`
- Gradient: `bg-gradient-to-r from-gold-500 to-gold-400`
- Width: `style={{ width: \`${progress}%\` }}`

### Percentage Display
- `font-mono text-gold-400 text-lg`
- Below progress bar, right-aligned

## Rotating Tips

**Tips Array:**
```typescript
const TIPS = [
  "💡 Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "💡 Did you know? Pro users get HD 1080p exports",
  "💡 Upgrade to Pro to remove watermarks",
  "💡 Premium users can create unlimited posters",
  "💡 Pro includes background removal for cleaner photos",
];
```

**Rotation Logic:**
- `useState` for `currentTipIndex` (starts at 0)
- `useEffect` with `setInterval` every 5000ms
- Increment: `(prev + 1) % TIPS.length`
- Clear interval on unmount

**Fade Transition:**
- `key={currentTipIndex}` triggers re-mount
- `animate-fade-in` class for entrance
- Fixed height container (`min-h-[3rem]`) prevents layout shift

## Time Estimate

**Initial:** "Usually takes 15-20 seconds"
**After 20s:** "Almost done! A few more seconds..."

**Implementation:**
```typescript
const [elapsedSeconds, setElapsedSeconds] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setElapsedSeconds((prev) => prev + 1);
  }, 1000);
  return () => clearInterval(interval);
}, []);

const timeMessage = elapsedSeconds >= 20
  ? "Almost done! A few more seconds..."
  : "Usually takes 15-20 seconds";
```

## Integration

**In PosterBuilderForm:**
```typescript
import { GenerationLoadingScreen } from './generation-loading-screen';

const { isGenerating, generationProgress } = usePosterBuilderStore(...);

return (
  <>
    {/* existing form JSX */}
    {isGenerating && (
      <GenerationLoadingScreen progress={generationProgress} />
    )}
  </>
);
```

## Accessibility

- `role="dialog"` and `aria-modal="true"`
- `aria-live="polite"` on progress for screen reader updates
- No close button or escape handling (cannot be dismissed)

## Test Cases

1. Loading screen appears when `isGenerating === true`
2. Loading screen hides when `isGenerating === false`
3. Progress bar width updates with `generationProgress`
4. Tips rotate every 5 seconds
5. Time estimate changes after 20 seconds
6. Screen cannot be dismissed
7. Proper ARIA attributes present

## Files

| Action | File |
|--------|------|
| Create | `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx` |
| Create | `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx` |
| Modify | `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx` |
