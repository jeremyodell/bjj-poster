# Zustand Store Setup Design

**Issue:** ODE-60 - UI-FND-003: Zustand Store Setup
**Date:** 2026-01-05

## Overview

Configure Zustand stores for global state management in the BJJ poster builder application. Two stores handle poster creation form state and user session/quota tracking.

## File Structure

```
apps/web/lib/stores/
├── poster-builder-store.ts   # Form state + localStorage persistence
├── user-store.ts             # User session + quota tracking
├── index.ts                  # Re-exports for clean imports
└── __tests__/
    ├── poster-builder-store.test.ts
    └── user-store.test.ts
```

## Dependencies

**Production:**
- `zustand` - State management

**Development:**
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities

## TypeScript Interfaces

### Poster Builder Store

```typescript
interface PosterBuilderState {
  // Form data
  athletePhoto: File | null;
  athleteName: string;
  beltRank: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  team: string;
  tournament: string;
  date: string;
  location: string;
  selectedTemplateId: string | null;

  // UI state (not persisted)
  isGenerating: boolean;
  generationProgress: number;
  showAdvancedOptions: boolean;
  showPreview: boolean;
}

interface PosterBuilderActions {
  setPhoto: (file: File | null) => void;
  setField: <K extends keyof PosterBuilderState>(key: K, value: PosterBuilderState[K]) => void;
  setTemplate: (templateId: string | null) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  toggleAdvancedOptions: () => void;
  togglePreview: () => void;
  reset: () => void;
}
```

### User Store

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

interface UserState {
  user: User | null;
  subscriptionTier: 'free' | 'pro' | 'premium';
  postersThisMonth: number;
  postersLimit: number;
}

interface UserActions {
  setUser: (user: User | null) => void;
  canCreatePoster: () => boolean;
  incrementUsage: () => void;
}
```

## Persistence Strategy

### Poster Builder Store

- **Storage key:** `poster-builder-draft`
- **Middleware:** `zustand/middleware` persist

**Persisted fields:**
- `athleteName`
- `beltRank`
- `team`
- `tournament`
- `date`
- `location`
- `selectedTemplateId`

**Excluded from persistence:**
- `athletePhoto` - File objects cannot be serialized
- `isGenerating`, `generationProgress` - Transient generation state
- `showAdvancedOptions`, `showPreview` - UI toggle state

**Hydration:** Use `skipHydration` option to prevent SSR mismatch in Next.js. Hydrate on client mount.

### User Store

No localStorage persistence. User session comes from auth provider, quota fetched from API.

## Subscription Tier Limits

| Tier    | postersLimit |
|---------|--------------|
| free    | 3            |
| pro     | 20           |
| premium | -1 (unlimited) |

`canCreatePoster()` returns `true` if:
- `postersLimit === -1` (unlimited), OR
- `postersThisMonth < postersLimit`

## DevTools

Enable Redux DevTools integration in development:

```typescript
import { devtools, persist } from 'zustand/middleware';

// Wrap stores with devtools middleware
devtools(store, { name: 'PosterBuilderStore' })
devtools(store, { name: 'UserStore' })
```

## Test Cases

### Poster Builder Store

1. `setField` updates state correctly
2. `setPhoto` sets athletePhoto
3. `setTemplate` updates selectedTemplateId
4. `setGenerating` updates isGenerating and generationProgress
5. `toggleAdvancedOptions` toggles showAdvancedOptions
6. `togglePreview` toggles showPreview
7. `reset` clears all form fields to defaults
8. localStorage persistence saves only partialized state
9. localStorage persistence excludes File and UI state

### User Store

1. `setUser` sets user object
2. `canCreatePoster` returns true when under quota
3. `canCreatePoster` returns false when at limit (free tier)
4. `canCreatePoster` returns true for premium (unlimited)
5. `incrementUsage` increments postersThisMonth by 1

## Implementation Tasks

1. Install dependencies (`zustand`, `vitest`, `@testing-library/react`)
2. Create `lib/stores/poster-builder-store.ts` with types, state, and actions
3. Add persist middleware with partialize for poster builder
4. Create `lib/stores/user-store.ts` with types, state, and actions
5. Create `lib/stores/index.ts` with re-exports
6. Write unit tests for poster builder store
7. Write unit tests for user store
8. Verify localStorage persistence works correctly
