# Zustand Store Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure Zustand stores for poster builder form state and user session/quota management with localStorage persistence and full test coverage.

**Architecture:** Two independent Zustand stores - `usePosterBuilderStore` manages form state with localStorage persistence for drafts, `useUserStore` manages user session and subscription quota. Both use devtools middleware for debugging.

**Tech Stack:** Zustand 5.x, Vitest, @testing-library/react, TypeScript

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install production dependencies**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm add zustand
```

**Step 2: Install dev dependencies for testing**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm add -D vitest @testing-library/react @vitejs/plugin-react jsdom
```

**Step 3: Verify installation**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm list zustand vitest
```

Expected: Both packages listed with versions

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "feat(web): add zustand and vitest dependencies"
```

---

## Task 2: Configure Vitest

**Files:**
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json` (add test scripts)

**Step 1: Create vitest config**

Create `apps/web/vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 2: Add test scripts to package.json**

Add to `apps/web/package.json` scripts section:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 3: Run vitest to verify setup**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test
```

Expected: "No test files found" (success - config works)

**Step 4: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/package.json
git commit -m "feat(web): configure vitest for unit testing"
```

---

## Task 3: Create Store Directory Structure

**Files:**
- Create: `apps/web/lib/stores/index.ts`

**Step 1: Create stores directory and index file**

Create `apps/web/lib/stores/index.ts`:

```typescript
// Store exports will be added as stores are created
export {};
```

**Step 2: Create test directory**

```bash
mkdir -p /home/bahar/bjj-poster/apps/web/lib/stores/__tests__
```

**Step 3: Commit**

```bash
git add apps/web/lib/stores/index.ts
git commit -m "feat(web): scaffold stores directory structure"
```

---

## Task 4: Write Poster Builder Store Tests (TDD - Red)

**Files:**
- Create: `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`

**Step 1: Write failing tests**

Create `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`:

```typescript
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePosterBuilderStore } from '../poster-builder-store';

describe('usePosterBuilderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      usePosterBuilderStore.getState().reset();
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = usePosterBuilderStore.getState();

      expect(state.athletePhoto).toBeNull();
      expect(state.athleteName).toBe('');
      expect(state.beltRank).toBe('white');
      expect(state.team).toBe('');
      expect(state.tournament).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
      expect(state.selectedTemplateId).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
      expect(state.showAdvancedOptions).toBe(false);
      expect(state.showPreview).toBe(false);
    });
  });

  describe('setField', () => {
    it('updates athleteName correctly', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
      });

      expect(usePosterBuilderStore.getState().athleteName).toBe('John Doe');
    });

    it('updates beltRank correctly', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('beltRank', 'purple');
      });

      expect(usePosterBuilderStore.getState().beltRank).toBe('purple');
    });

    it('updates multiple fields independently', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('team', 'Gracie Barra');
        usePosterBuilderStore.getState().setField('tournament', 'IBJJF Worlds');
      });

      const state = usePosterBuilderStore.getState();
      expect(state.team).toBe('Gracie Barra');
      expect(state.tournament).toBe('IBJJF Worlds');
    });
  });

  describe('setPhoto', () => {
    it('sets athletePhoto to File object', () => {
      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        usePosterBuilderStore.getState().setPhoto(mockFile);
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBe(mockFile);
    });

    it('sets athletePhoto to null', () => {
      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        usePosterBuilderStore.getState().setPhoto(mockFile);
        usePosterBuilderStore.getState().setPhoto(null);
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBeNull();
    });
  });

  describe('setTemplate', () => {
    it('sets selectedTemplateId', () => {
      act(() => {
        usePosterBuilderStore.getState().setTemplate('template-123');
      });

      expect(usePosterBuilderStore.getState().selectedTemplateId).toBe('template-123');
    });

    it('clears selectedTemplateId with null', () => {
      act(() => {
        usePosterBuilderStore.getState().setTemplate('template-123');
        usePosterBuilderStore.getState().setTemplate(null);
      });

      expect(usePosterBuilderStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe('setGenerating', () => {
    it('sets isGenerating to true', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true);
      });

      expect(usePosterBuilderStore.getState().isGenerating).toBe(true);
    });

    it('sets isGenerating and progress together', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true, 50);
      });

      const state = usePosterBuilderStore.getState();
      expect(state.isGenerating).toBe(true);
      expect(state.generationProgress).toBe(50);
    });

    it('resets progress when setting isGenerating to false', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true, 75);
        usePosterBuilderStore.getState().setGenerating(false);
      });

      const state = usePosterBuilderStore.getState();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
    });
  });

  describe('toggleAdvancedOptions', () => {
    it('toggles from false to true', () => {
      act(() => {
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      expect(usePosterBuilderStore.getState().showAdvancedOptions).toBe(true);
    });

    it('toggles from true to false', () => {
      act(() => {
        usePosterBuilderStore.getState().toggleAdvancedOptions();
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      expect(usePosterBuilderStore.getState().showAdvancedOptions).toBe(false);
    });
  });

  describe('togglePreview', () => {
    it('toggles from false to true', () => {
      act(() => {
        usePosterBuilderStore.getState().togglePreview();
      });

      expect(usePosterBuilderStore.getState().showPreview).toBe(true);
    });

    it('toggles from true to false', () => {
      act(() => {
        usePosterBuilderStore.getState().togglePreview();
        usePosterBuilderStore.getState().togglePreview();
      });

      expect(usePosterBuilderStore.getState().showPreview).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all fields to initial values', () => {
      // Set up state with various values
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
        usePosterBuilderStore.getState().setField('beltRank', 'black');
        usePosterBuilderStore.getState().setField('team', 'Team Alpha');
        usePosterBuilderStore.getState().setTemplate('template-456');
        usePosterBuilderStore.getState().setGenerating(true, 50);
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      // Reset
      act(() => {
        usePosterBuilderStore.getState().reset();
      });

      // Verify all values are back to defaults
      const state = usePosterBuilderStore.getState();
      expect(state.athletePhoto).toBeNull();
      expect(state.athleteName).toBe('');
      expect(state.beltRank).toBe('white');
      expect(state.team).toBe('');
      expect(state.tournament).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
      expect(state.selectedTemplateId).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
      expect(state.showAdvancedOptions).toBe(false);
      expect(state.showPreview).toBe(false);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores/__tests__/poster-builder-store.test.ts
```

Expected: FAIL - Cannot find module '../poster-builder-store'

**Step 3: Commit failing tests**

```bash
git add apps/web/lib/stores/__tests__/poster-builder-store.test.ts
git commit -m "test(web): add poster builder store tests (red)"
```

---

## Task 5: Implement Poster Builder Store (TDD - Green)

**Files:**
- Create: `apps/web/lib/stores/poster-builder-store.ts`
- Modify: `apps/web/lib/stores/index.ts`

**Step 1: Create the poster builder store**

Create `apps/web/lib/stores/poster-builder-store.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export interface PosterBuilderState {
  // Form data
  athletePhoto: File | null;
  athleteName: string;
  beltRank: BeltRank;
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

export interface PosterBuilderActions {
  setPhoto: (file: File | null) => void;
  setField: <K extends keyof PosterBuilderState>(
    key: K,
    value: PosterBuilderState[K]
  ) => void;
  setTemplate: (templateId: string | null) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  toggleAdvancedOptions: () => void;
  togglePreview: () => void;
  reset: () => void;
}

export type PosterBuilderStore = PosterBuilderState & PosterBuilderActions;

const initialState: PosterBuilderState = {
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white',
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
};

export const usePosterBuilderStore = create<PosterBuilderStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setPhoto: (file) => set({ athletePhoto: file }),

        setField: (key, value) => set({ [key]: value }),

        setTemplate: (templateId) => set({ selectedTemplateId: templateId }),

        setGenerating: (isGenerating, progress) =>
          set({
            isGenerating,
            generationProgress: isGenerating ? (progress ?? 0) : 0,
          }),

        toggleAdvancedOptions: () =>
          set((state) => ({ showAdvancedOptions: !state.showAdvancedOptions })),

        togglePreview: () =>
          set((state) => ({ showPreview: !state.showPreview })),

        reset: () => set(initialState),
      }),
      {
        name: 'poster-builder-draft',
        partialize: (state) => ({
          athleteName: state.athleteName,
          beltRank: state.beltRank,
          team: state.team,
          tournament: state.tournament,
          date: state.date,
          location: state.location,
          selectedTemplateId: state.selectedTemplateId,
        }),
        skipHydration: true,
      }
    ),
    { name: 'PosterBuilderStore' }
  )
);
```

**Step 2: Update index.ts to export the store**

Update `apps/web/lib/stores/index.ts`:

```typescript
export {
  usePosterBuilderStore,
  type BeltRank,
  type PosterBuilderActions,
  type PosterBuilderState,
  type PosterBuilderStore,
} from './poster-builder-store';
```

**Step 3: Run tests to verify they pass**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores/__tests__/poster-builder-store.test.ts
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add apps/web/lib/stores/poster-builder-store.ts apps/web/lib/stores/index.ts
git commit -m "feat(web): implement poster builder store"
```

---

## Task 6: Write User Store Tests (TDD - Red)

**Files:**
- Create: `apps/web/lib/stores/__tests__/user-store.test.ts`

**Step 1: Write failing tests**

Create `apps/web/lib/stores/__tests__/user-store.test.ts`:

```typescript
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUserStore } from '../user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useUserStore.setState({
        user: null,
        subscriptionTier: 'free',
        postersThisMonth: 0,
        postersLimit: 3,
      });
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.subscriptionTier).toBe('free');
      expect(state.postersThisMonth).toBe(0);
      expect(state.postersLimit).toBe(3);
    });
  });

  describe('setUser', () => {
    it('sets user object', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      act(() => {
        useUserStore.getState().setUser(mockUser);
      });

      expect(useUserStore.getState().user).toEqual(mockUser);
    });

    it('clears user with null', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      act(() => {
        useUserStore.getState().setUser(mockUser);
        useUserStore.getState().setUser(null);
      });

      expect(useUserStore.getState().user).toBeNull();
    });

    it('updates subscription tier and limits based on user tier', () => {
      const proUser = {
        id: 'user-123',
        email: 'pro@example.com',
        name: 'Pro User',
      };

      act(() => {
        useUserStore.getState().setUser(proUser, 'pro');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('pro');
      expect(state.postersLimit).toBe(20);
    });

    it('sets unlimited posters for premium tier', () => {
      const premiumUser = {
        id: 'user-456',
        email: 'premium@example.com',
        name: 'Premium User',
      };

      act(() => {
        useUserStore.getState().setUser(premiumUser, 'premium');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('premium');
      expect(state.postersLimit).toBe(-1);
    });
  });

  describe('canCreatePoster', () => {
    it('returns true when under quota (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 2,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns false when at limit (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });

    it('returns false when over limit (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 5,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });

    it('returns true for premium tier regardless of usage', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'premium',
          postersThisMonth: 100,
          postersLimit: -1,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns true when pro tier is under limit', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 19,
          postersLimit: 20,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns false when pro tier is at limit', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 20,
          postersLimit: 20,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });
  });

  describe('incrementUsage', () => {
    it('increments postersThisMonth by 1', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 0 });
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(1);
    });

    it('increments from existing count', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 5 });
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(6);
    });

    it('can increment multiple times', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 0 });
        useUserStore.getState().incrementUsage();
        useUserStore.getState().incrementUsage();
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(3);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores/__tests__/user-store.test.ts
```

Expected: FAIL - Cannot find module '../user-store'

**Step 3: Commit failing tests**

```bash
git add apps/web/lib/stores/__tests__/user-store.test.ts
git commit -m "test(web): add user store tests (red)"
```

---

## Task 7: Implement User Store (TDD - Green)

**Files:**
- Create: `apps/web/lib/stores/user-store.ts`
- Modify: `apps/web/lib/stores/index.ts`

**Step 1: Create the user store**

Create `apps/web/lib/stores/user-store.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserState {
  user: User | null;
  subscriptionTier: SubscriptionTier;
  postersThisMonth: number;
  postersLimit: number;
}

export interface UserActions {
  setUser: (user: User | null, tier?: SubscriptionTier) => void;
  canCreatePoster: () => boolean;
  incrementUsage: () => void;
}

export type UserStore = UserState & UserActions;

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 20,
  premium: -1, // unlimited
};

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      user: null,
      subscriptionTier: 'free',
      postersThisMonth: 0,
      postersLimit: TIER_LIMITS.free,

      setUser: (user, tier = 'free') =>
        set({
          user,
          subscriptionTier: tier,
          postersLimit: TIER_LIMITS[tier],
        }),

      canCreatePoster: () => {
        const { postersLimit, postersThisMonth } = get();
        // -1 means unlimited
        if (postersLimit === -1) return true;
        return postersThisMonth < postersLimit;
      },

      incrementUsage: () =>
        set((state) => ({
          postersThisMonth: state.postersThisMonth + 1,
        })),
    }),
    { name: 'UserStore' }
  )
);
```

**Step 2: Update index.ts to export user store**

Update `apps/web/lib/stores/index.ts`:

```typescript
export {
  usePosterBuilderStore,
  type BeltRank,
  type PosterBuilderActions,
  type PosterBuilderState,
  type PosterBuilderStore,
} from './poster-builder-store';

export {
  useUserStore,
  type SubscriptionTier,
  type User,
  type UserActions,
  type UserState,
  type UserStore,
} from './user-store';
```

**Step 3: Run tests to verify they pass**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores/__tests__/user-store.test.ts
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add apps/web/lib/stores/user-store.ts apps/web/lib/stores/index.ts
git commit -m "feat(web): implement user store"
```

---

## Task 8: Add Persistence Tests for Poster Builder Store

**Files:**
- Modify: `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`

**Step 1: Add persistence tests to existing file**

Add the following describe block to `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`:

```typescript
describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists form fields to localStorage', () => {
    act(() => {
      usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
      usePosterBuilderStore.getState().setField('team', 'Gracie Barra');
      usePosterBuilderStore.getState().setField('beltRank', 'purple');
    });

    // Manually trigger persist (in real app this happens automatically)
    usePosterBuilderStore.persist.rehydrate();

    const stored = localStorage.getItem('poster-builder-draft');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.athleteName).toBe('John Doe');
    expect(parsed.state.team).toBe('Gracie Barra');
    expect(parsed.state.beltRank).toBe('purple');
  });

  it('excludes athletePhoto from persistence', () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    act(() => {
      usePosterBuilderStore.getState().setPhoto(mockFile);
      usePosterBuilderStore.getState().setField('athleteName', 'Test');
    });

    usePosterBuilderStore.persist.rehydrate();

    const stored = localStorage.getItem('poster-builder-draft');
    const parsed = JSON.parse(stored!);

    expect(parsed.state.athletePhoto).toBeUndefined();
    expect(parsed.state.athleteName).toBe('Test');
  });

  it('excludes UI state from persistence', () => {
    act(() => {
      usePosterBuilderStore.getState().setField('athleteName', 'Test');
      usePosterBuilderStore.getState().setGenerating(true, 50);
      usePosterBuilderStore.getState().toggleAdvancedOptions();
      usePosterBuilderStore.getState().togglePreview();
    });

    usePosterBuilderStore.persist.rehydrate();

    const stored = localStorage.getItem('poster-builder-draft');
    const parsed = JSON.parse(stored!);

    expect(parsed.state.isGenerating).toBeUndefined();
    expect(parsed.state.generationProgress).toBeUndefined();
    expect(parsed.state.showAdvancedOptions).toBeUndefined();
    expect(parsed.state.showPreview).toBeUndefined();
  });
});
```

**Step 2: Run all poster builder store tests**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores/__tests__/poster-builder-store.test.ts
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add apps/web/lib/stores/__tests__/poster-builder-store.test.ts
git commit -m "test(web): add localStorage persistence tests"
```

---

## Task 9: Run Full Test Suite and Verify

**Files:**
- None (verification only)

**Step 1: Run all store tests**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm test lib/stores
```

Expected: All tests PASS

**Step 2: Run type check**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm type-check
```

Expected: No type errors

**Step 3: Run lint**

```bash
cd /home/bahar/bjj-poster/apps/web && pnpm lint
```

Expected: No lint errors (or only warnings)

---

## Task 10: Final Commit and Summary

**Files:**
- None (final verification)

**Step 1: Verify all changes are committed**

```bash
git status
```

Expected: Clean working tree

**Step 2: Review commit history**

```bash
git log --oneline -10
```

Expected: 8 commits for this feature (dependencies, vitest config, scaffold, tests red/green for both stores, persistence tests)

---

## Summary of Created Files

| File | Purpose |
|------|---------|
| `apps/web/lib/stores/poster-builder-store.ts` | Poster form state with localStorage persistence |
| `apps/web/lib/stores/user-store.ts` | User session and quota tracking |
| `apps/web/lib/stores/index.ts` | Re-exports for clean imports |
| `apps/web/lib/stores/__tests__/poster-builder-store.test.ts` | Unit tests for poster builder store |
| `apps/web/lib/stores/__tests__/user-store.test.ts` | Unit tests for user store |
| `apps/web/vitest.config.ts` | Vitest configuration |
