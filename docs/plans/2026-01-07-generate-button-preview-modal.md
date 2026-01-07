# Generate Button & Preview Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the "Generate Poster" button with validation, floating preview button, and full-screen preview modal.

**Architecture:** Components follow existing patterns - Zustand store for state, Radix Dialog for modal, CVA for button variants. Mock API simulates realistic progress. Client-side preview uses HTML/CSS layering.

**Tech Stack:** React 18, Zustand, Radix UI Dialog, Tailwind CSS, Vitest, React Testing Library

---

## Task 1: Mock Generate Poster API

**Files:**
- Create: `apps/web/lib/api/generate-poster.ts`
- Test: `apps/web/lib/api/__tests__/generate-poster.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/lib/api/__tests__/generate-poster.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePoster, GeneratePosterRequest } from '../generate-poster';

describe('generatePoster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validRequest: GeneratePosterRequest = {
    athletePhoto: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
    athleteName: 'John Doe',
    beltRank: 'purple',
    tournament: 'IBJJF Worlds',
    templateId: 'template-123',
  };

  it('returns a poster response with id and imageUrl', async () => {
    const promise = generatePoster(validRequest);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.posterId).toBeDefined();
    expect(result.imageUrl).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it('calls progress callback with increasing values', async () => {
    const onProgress = vi.fn();
    const promise = generatePoster(validRequest, onProgress);

    await vi.runAllTimersAsync();
    await promise;

    expect(onProgress).toHaveBeenCalled();
    const calls = onProgress.mock.calls.map(c => c[0]);
    // Progress should increase
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i]).toBeGreaterThanOrEqual(calls[i - 1]);
    }
    // Should reach 100
    expect(calls[calls.length - 1]).toBe(100);
  });

  it('includes optional fields in request', async () => {
    const requestWithOptionals: GeneratePosterRequest = {
      ...validRequest,
      team: 'Gracie Barra',
      date: '2026-03-15',
      location: 'Irvine, CA',
    };

    const promise = generatePoster(requestWithOptionals);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.posterId).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/lib/api/__tests__/generate-poster.test.ts`
Expected: FAIL with "Cannot find module '../generate-poster'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/lib/api/generate-poster.ts
import type { BeltRank } from '@/lib/stores/poster-builder-store';

export interface GeneratePosterRequest {
  athletePhoto: File;
  athleteName: string;
  beltRank: BeltRank;
  team?: string;
  tournament: string;
  date?: string;
  location?: string;
  templateId: string;
}

export interface GeneratePosterResponse {
  posterId: string;
  imageUrl: string;
  createdAt: string;
}

export type ProgressCallback = (progress: number) => void;

async function simulateProgress(
  start: number,
  end: number,
  durationMs: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const steps = 10;
  const stepDuration = durationMs / steps;
  const increment = (end - start) / steps;

  for (let i = 0; i <= steps; i++) {
    const progress = Math.round(start + increment * i);
    onProgress?.(progress);
    if (i < steps) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }
}

/**
 * Mock poster generation API.
 * Simulates realistic progress: upload (0-30%), processing (30-90%), finalization (90-100%).
 * TODO: Replace with real API call when backend is ready.
 */
export async function generatePoster(
  _request: GeneratePosterRequest,
  onProgress?: ProgressCallback
): Promise<GeneratePosterResponse> {
  // Simulate upload phase (0-30%)
  await simulateProgress(0, 30, 500, onProgress);

  // Simulate processing phase (30-90%)
  await simulateProgress(30, 90, 1500, onProgress);

  // Simulate finalization (90-100%)
  await simulateProgress(90, 100, 300, onProgress);

  return {
    posterId: crypto.randomUUID(),
    imageUrl: '/mock-generated-poster.png',
    createdAt: new Date().toISOString(),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/lib/api/__tests__/generate-poster.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add apps/web/lib/api/generate-poster.ts apps/web/lib/api/__tests__/generate-poster.test.ts
git commit -m "feat(api): add mock generatePoster API with progress simulation"
```

---

## Task 2: Add generatePoster Action to Store

**Files:**
- Modify: `apps/web/lib/stores/poster-builder-store.ts`
- Test: `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`

**Step 1: Write the failing tests**

Add to `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`:

```typescript
// Add at the top of the file
import { generatePoster } from '@/lib/api/generate-poster';

// Mock the API
vi.mock('@/lib/api/generate-poster', () => ({
  generatePoster: vi.fn(),
}));

// Add this describe block at the end, before the closing });
describe('generatePoster action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generatePoster).mockResolvedValue({
      posterId: 'mock-id',
      imageUrl: '/mock.png',
      createdAt: '2026-01-07T00:00:00.000Z',
    });
  });

  it('sets isGenerating to true while generating', async () => {
    // Setup valid form data
    act(() => {
      usePosterBuilderStore.getState().setPhoto(new File([''], 'photo.jpg'));
      usePosterBuilderStore.getState().setField('athleteName', 'John');
      usePosterBuilderStore.getState().setField('beltRank', 'purple');
      usePosterBuilderStore.getState().setField('tournament', 'Worlds');
      usePosterBuilderStore.getState().setTemplate('template-1');
    });

    const promise = usePosterBuilderStore.getState().generatePoster();

    expect(usePosterBuilderStore.getState().isGenerating).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(usePosterBuilderStore.getState().isGenerating).toBe(false);
  });

  it('calls API with correct request data', async () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    act(() => {
      usePosterBuilderStore.getState().setPhoto(mockFile);
      usePosterBuilderStore.getState().setField('athleteName', 'Jane Doe');
      usePosterBuilderStore.getState().setField('beltRank', 'brown');
      usePosterBuilderStore.getState().setField('team', 'Alliance');
      usePosterBuilderStore.getState().setField('tournament', 'Pan Ams');
      usePosterBuilderStore.getState().setField('date', '2026-03-15');
      usePosterBuilderStore.getState().setField('location', 'Irvine');
      usePosterBuilderStore.getState().setTemplate('template-2');
    });

    await act(async () => {
      await usePosterBuilderStore.getState().generatePoster();
    });

    expect(generatePoster).toHaveBeenCalledWith(
      {
        athletePhoto: mockFile,
        athleteName: 'Jane Doe',
        beltRank: 'brown',
        team: 'Alliance',
        tournament: 'Pan Ams',
        date: '2026-03-15',
        location: 'Irvine',
        templateId: 'template-2',
      },
      expect.any(Function)
    );
  });

  it('returns generated poster data on success', async () => {
    act(() => {
      usePosterBuilderStore.getState().setPhoto(new File([''], 'photo.jpg'));
      usePosterBuilderStore.getState().setField('athleteName', 'John');
      usePosterBuilderStore.getState().setField('beltRank', 'blue');
      usePosterBuilderStore.getState().setField('tournament', 'Worlds');
      usePosterBuilderStore.getState().setTemplate('template-1');
    });

    let result;
    await act(async () => {
      result = await usePosterBuilderStore.getState().generatePoster();
    });

    expect(result).toEqual({
      posterId: 'mock-id',
      imageUrl: '/mock.png',
      createdAt: '2026-01-07T00:00:00.000Z',
    });
  });

  it('throws error if required fields are missing', async () => {
    // Don't set any fields
    await expect(
      usePosterBuilderStore.getState().generatePoster()
    ).rejects.toThrow('Missing required fields');
  });

  it('resets isGenerating on error', async () => {
    vi.mocked(generatePoster).mockRejectedValue(new Error('API Error'));

    act(() => {
      usePosterBuilderStore.getState().setPhoto(new File([''], 'photo.jpg'));
      usePosterBuilderStore.getState().setField('athleteName', 'John');
      usePosterBuilderStore.getState().setField('beltRank', 'blue');
      usePosterBuilderStore.getState().setField('tournament', 'Worlds');
      usePosterBuilderStore.getState().setTemplate('template-1');
    });

    await expect(
      act(async () => {
        await usePosterBuilderStore.getState().generatePoster();
      })
    ).rejects.toThrow('API Error');

    expect(usePosterBuilderStore.getState().isGenerating).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/lib/stores/__tests__/poster-builder-store.test.ts`
Expected: FAIL with "generatePoster is not a function" or similar

**Step 3: Write minimal implementation**

Update `apps/web/lib/stores/poster-builder-store.ts`:

```typescript
// Add import at top
import {
  generatePoster as generatePosterApi,
  type GeneratePosterResponse,
} from '@/lib/api/generate-poster';

// Update PosterBuilderActions interface - add after reset:
export interface PosterBuilderActions {
  // ... existing actions ...
  /**
   * Generates a poster using the current form data.
   * @throws Error if required fields are missing
   * @returns The generated poster response
   */
  generatePoster: () => Promise<GeneratePosterResponse>;
}

// Add the action implementation in the create() call, after reset:
generatePoster: async () => {
  const state = get();

  // Validate required fields
  if (
    !state.athletePhoto ||
    !state.athleteName.trim() ||
    !state.beltRank ||
    !state.tournament.trim() ||
    !state.selectedTemplateId
  ) {
    throw new Error('Missing required fields');
  }

  set({ isGenerating: true, generationProgress: 0 });

  try {
    const result = await generatePosterApi(
      {
        athletePhoto: state.athletePhoto,
        athleteName: state.athleteName,
        beltRank: state.beltRank,
        team: state.team || undefined,
        tournament: state.tournament,
        date: state.date || undefined,
        location: state.location || undefined,
        templateId: state.selectedTemplateId,
      },
      (progress) => set({ generationProgress: progress })
    );

    set({ isGenerating: false, generationProgress: 0 });
    return result;
  } catch (error) {
    set({ isGenerating: false, generationProgress: 0 });
    throw error;
  }
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/lib/stores/__tests__/poster-builder-store.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/lib/stores/poster-builder-store.ts apps/web/lib/stores/__tests__/poster-builder-store.test.ts
git commit -m "feat(store): add generatePoster action with validation"
```

---

## Task 3: Create PosterPreviewCanvas Component

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/poster-preview-canvas.tsx`
- Test: `apps/web/components/builder/poster-builder-form/__tests__/poster-preview-canvas.test.tsx`
- Create: `apps/web/components/builder/poster-builder-form/index.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/poster-preview-canvas.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterPreviewCanvas } from '../poster-preview-canvas';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock URL.createObjectURL
const mockObjectUrl = 'blob:mock-url';
global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
global.URL.revokeObjectURL = vi.fn();

// Mock the store
const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  generatePoster: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

// Mock useTemplates hook
vi.mock('@/lib/hooks/use-templates', () => ({
  useTemplates: () => ({
    data: [
      { id: 'template-1', name: 'Classic', thumbnailUrl: '/templates/classic.jpg' },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PosterPreviewCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with 3:4 aspect ratio container', () => {
    render(<PosterPreviewCanvas />);

    const container = screen.getByTestId('poster-preview-canvas');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('aspect-[3/4]');
  });

  it('shows placeholder when no template is selected', () => {
    render(<PosterPreviewCanvas />);

    expect(screen.getByTestId('template-placeholder')).toBeInTheDocument();
  });

  it('shows template background when template is selected', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ selectedTemplateId: 'template-1' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const templateBg = screen.getByTestId('template-background');
    expect(templateBg).toBeInTheDocument();
  });

  it('shows photo placeholder when no photo uploaded', () => {
    render(<PosterPreviewCanvas />);

    expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('shows athlete photo when uploaded', () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: mockFile });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const photo = screen.getByTestId('athlete-photo');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', mockObjectUrl);
  });

  it('displays athlete name when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John Doe' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays belt rank with correct color class', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ beltRank: 'purple' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const beltIndicator = screen.getByTestId('belt-indicator');
    expect(beltIndicator).toHaveClass('bg-purple-600');
  });

  it('displays tournament name when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ tournament: 'IBJJF Worlds 2026' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('IBJJF Worlds 2026')).toBeInTheDocument();
  });

  it('displays date and location when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        date: '2026-03-15',
        location: 'Irvine, CA',
      });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('Irvine, CA')).toBeInTheDocument();
  });

  it('cleans up object URL on unmount', () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: mockFile });
      return selector ? selector(state) : state;
    });

    const { unmount } = render(<PosterPreviewCanvas />);
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/poster-preview-canvas.test.tsx`
Expected: FAIL with "Cannot find module '../poster-preview-canvas'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/poster-preview-canvas.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';
import { useTemplates } from '@/lib/hooks/use-templates';

const BELT_COLORS: Record<string, string> = {
  white: 'bg-gray-100 border border-gray-300',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-black',
  'red-black': 'bg-gradient-to-r from-red-600 to-black',
  red: 'bg-red-600',
};

interface PosterPreviewCanvasProps {
  className?: string;
}

export function PosterPreviewCanvas({ className }: PosterPreviewCanvasProps): JSX.Element {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    date,
    location,
    selectedTemplateId,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      date: state.date,
      location: state.location,
      selectedTemplateId: state.selectedTemplateId,
    }))
  );

  const { data: templates } = useTemplates();
  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Create object URL for photo preview
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (athletePhoto) {
      const url = URL.createObjectURL(athletePhoto);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPhotoUrl(null);
    }
  }, [athletePhoto]);

  return (
    <div
      data-testid="poster-preview-canvas"
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-primary-900',
        className
      )}
    >
      {/* Layer 1: Template background */}
      {selectedTemplate ? (
        <Image
          data-testid="template-background"
          src={selectedTemplate.thumbnailUrl}
          alt={selectedTemplate.name}
          fill
          className="object-cover"
        />
      ) : (
        <div
          data-testid="template-placeholder"
          className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950"
        >
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px]" />
        </div>
      )}

      {/* Layer 2: Photo zone */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] aspect-[3/4]">
        {photoUrl ? (
          <img
            data-testid="athlete-photo"
            src={photoUrl}
            alt="Athlete"
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
        ) : (
          <div
            data-testid="photo-placeholder"
            className="w-full h-full flex items-center justify-center bg-primary-800/50 rounded-lg border-2 border-dashed border-primary-600"
          >
            <User className="w-16 h-16 text-primary-500" />
          </div>
        )}
      </div>

      {/* Layer 3: Text overlays */}
      <div className="absolute bottom-[5%] left-0 right-0 px-4 text-center space-y-2">
        {athleteName && (
          <h2 className="font-display text-xl text-white font-bold drop-shadow-lg">
            {athleteName}
          </h2>
        )}

        <div
          data-testid="belt-indicator"
          className={cn('inline-block h-2 w-20 rounded-full', BELT_COLORS[beltRank])}
        />

        {tournament && (
          <p className="text-sm text-primary-200 font-medium">{tournament}</p>
        )}

        {(date || location) && (
          <div className="text-xs text-primary-300 space-x-2">
            {date && <span>{date}</span>}
            {location && <span>{location}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
```

Create the index file:

```typescript
// apps/web/components/builder/poster-builder-form/index.ts
export { PosterPreviewCanvas } from './poster-preview-canvas';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/poster-preview-canvas.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/
git commit -m "feat(builder): add PosterPreviewCanvas component"
```

---

## Task 4: Create GenerateButton Component

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/generate-button.tsx`
- Test: `apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx`
- Update: `apps/web/components/builder/poster-builder-form/index.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateButton } from '../generate-button';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock the store
const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  generatePoster: vi.fn().mockResolvedValue({ posterId: '123', imageUrl: '/poster.png', createdAt: '' }),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('GenerateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('disabled state', () => {
    it('is disabled when no photo is uploaded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when athlete name is empty', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when tournament is empty', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when no template is selected', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows tooltip when disabled', async () => {
      const user = userEvent.setup();
      render(<GenerateButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByText(/complete required fields/i)).toBeInTheDocument();
      });
    });
  });

  describe('enabled state', () => {
    beforeEach(() => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John Doe',
          beltRank: 'purple',
          tournament: 'IBJJF Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });
    });

    it('is enabled when all required fields are filled', () => {
      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('displays "Generate Poster" text', () => {
      render(<GenerateButton />);

      expect(screen.getByRole('button')).toHaveTextContent(/generate poster/i);
    });

    it('calls generatePoster on click', async () => {
      const mockGeneratePoster = vi.fn().mockResolvedValue({});
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John Doe',
          beltRank: 'purple',
          tournament: 'IBJJF Worlds',
          selectedTemplateId: 'template-1',
          generatePoster: mockGeneratePoster,
        });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<GenerateButton />);

      await user.click(screen.getByRole('button'));

      expect(mockGeneratePoster).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          isGenerating: true,
          generationProgress: 50,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows progress percentage when generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          isGenerating: true,
          generationProgress: 75,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });

    it('is disabled while generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
          isGenerating: true,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx`
Expected: FAIL with "Cannot find module '../generate-button'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/generate-button.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePosterBuilderStore } from '@/lib/stores';

export function GenerateButton(): JSX.Element {
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
      await generatePoster();
      // TODO: Handle success (show result, navigate to poster)
    } catch (error) {
      // TODO: Show error toast
      console.error('Generation failed:', error);
    }
  };

  const buttonContent = isGenerating ? (
    <>
      <Loader2 data-testid="loading-spinner" className="h-4 w-4 animate-spin" />
      <span>Generating... {generationProgress}%</span>
    </>
  ) : (
    <span>Generate Poster</span>
  );

  const button = (
    <Button
      size="lg"
      disabled={isDisabled}
      onClick={handleClick}
      className="w-full"
    >
      {buttonContent}
    </Button>
  );

  // Wrap disabled button in tooltip
  if (!isValid && !isGenerating) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Complete required fields to generate</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
```

Update the index file:

```typescript
// apps/web/components/builder/poster-builder-form/index.ts
export { PosterPreviewCanvas } from './poster-preview-canvas';
export { GenerateButton } from './generate-button';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/
git commit -m "feat(builder): add GenerateButton with validation and loading state"
```

---

## Task 5: Create FloatingPreviewButton Component

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/floating-preview-button.tsx`
- Test: `apps/web/components/builder/poster-builder-form/__tests__/floating-preview-button.test.tsx`
- Update: `apps/web/components/builder/poster-builder-form/index.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/floating-preview-button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloatingPreviewButton } from '../floating-preview-button';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  generatePoster: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('FloatingPreviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not rendered when no form data exists', () => {
    render(<FloatingPreviewButton />);

    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
  });

  it('is rendered when any form field has data', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('is rendered when photo is uploaded', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: new File([''], 'photo.jpg') });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('is rendered when template is selected', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ selectedTemplateId: 'template-1' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('calls togglePreview on click', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        athleteName: 'John',
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<FloatingPreviewButton />);

    await user.click(screen.getByRole('button', { name: /preview/i }));

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('has fixed positioning at bottom-right', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    const button = screen.getByRole('button', { name: /preview/i });
    expect(button.parentElement).toHaveClass('fixed');
  });

  it('shows eye icon', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('shows pulse animation when all required fields are valid', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        athletePhoto: new File([''], 'photo.jpg'),
        athleteName: 'John Doe',
        beltRank: 'purple',
        tournament: 'Worlds',
        selectedTemplateId: 'template-1',
      });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    const button = screen.getByRole('button', { name: /preview/i });
    expect(button).toHaveClass('animate-pulse-subtle');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/floating-preview-button.test.tsx`
Expected: FAIL with "Cannot find module '../floating-preview-button'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/floating-preview-button.tsx
'use client';

import { Eye } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';

export function FloatingPreviewButton(): JSX.Element | null {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    togglePreview,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      togglePreview: state.togglePreview,
    }))
  );

  // Check if any form data exists
  const hasAnyData = Boolean(
    athletePhoto ||
    athleteName.trim() ||
    tournament.trim() ||
    selectedTemplateId
  );

  // Check if all required fields are valid
  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  // Don't render if no data
  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-8">
      <Button
        variant="secondary"
        size="icon"
        onClick={togglePreview}
        aria-label="Preview poster"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          isValid && 'animate-pulse-subtle'
        )}
      >
        <Eye data-testid="eye-icon" className="h-6 w-6" />
      </Button>
    </div>
  );
}
```

Add the pulse animation to Tailwind config (if not already present). First check if it exists:

```typescript
// apps/web/components/builder/poster-builder-form/index.ts
export { PosterPreviewCanvas } from './poster-preview-canvas';
export { GenerateButton } from './generate-button';
export { FloatingPreviewButton } from './floating-preview-button';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/floating-preview-button.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/
git commit -m "feat(builder): add FloatingPreviewButton with visibility logic"
```

---

## Task 6: Create PreviewModal Component

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/preview-modal.tsx`
- Test: `apps/web/components/builder/poster-builder-form/__tests__/preview-modal.test.tsx`
- Update: `apps/web/components/builder/poster-builder-form/index.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/preview-modal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreviewModal } from '../preview-modal';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  generatePoster: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/hooks/use-templates', () => ({
  useTemplates: () => ({
    data: [{ id: 'template-1', name: 'Classic', thumbnailUrl: '/templates/classic.jpg' }],
    isLoading: false,
    error: null,
  }),
}));

describe('PreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not rendered when showPreview is false', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: false });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is rendered when showPreview is true', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: true });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls togglePreview when close button is clicked', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<PreviewModal />);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('calls togglePreview when ESC key is pressed', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<PreviewModal />);

    await user.keyboard('{Escape}');

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('renders PosterPreviewCanvas inside the modal', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: true });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.getByTestId('poster-preview-canvas')).toBeInTheDocument();
  });

  it('closes on swipe down (touch gesture)', () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    const content = screen.getByTestId('preview-modal-content');

    // Simulate swipe down
    fireEvent.touchStart(content, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientY: 250 }] });

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('does not close on small swipe', () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    const content = screen.getByTestId('preview-modal-content');

    // Simulate small swipe (less than 100px)
    fireEvent.touchStart(content, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientY: 150 }] });

    expect(mockTogglePreview).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/preview-modal.test.tsx`
Expected: FAIL with "Cannot find module '../preview-modal'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/preview-modal.tsx
'use client';

import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePosterBuilderStore } from '@/lib/stores';
import { PosterPreviewCanvas } from './poster-preview-canvas';

export function PreviewModal(): JSX.Element | null {
  const { showPreview, togglePreview } = usePosterBuilderStore(
    useShallow((state) => ({
      showPreview: state.showPreview,
      togglePreview: state.togglePreview,
    }))
  );

  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      togglePreview();
    }
  };

  return (
    <Dialog open={showPreview} onOpenChange={togglePreview}>
      <DialogContent
        data-testid="preview-modal-content"
        className="max-w-[800px] h-[90vh] md:h-auto p-0 md:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <DialogTitle className="sr-only">Poster Preview</DialogTitle>
        <div className="flex items-center justify-center h-full p-4 md:p-0">
          <PosterPreviewCanvas className="max-h-full w-full max-w-[400px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Update the index file:

```typescript
// apps/web/components/builder/poster-builder-form/index.ts
export { PosterPreviewCanvas } from './poster-preview-canvas';
export { GenerateButton } from './generate-button';
export { FloatingPreviewButton } from './floating-preview-button';
export { PreviewModal } from './preview-modal';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/preview-modal.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/
git commit -m "feat(builder): add PreviewModal with swipe-to-dismiss"
```

---

## Task 7: Create PosterBuilderForm Wrapper

**Files:**
- Create: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`
- Test: `apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`
- Update: `apps/web/components/builder/poster-builder-form/index.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterBuilderForm } from '../poster-builder-form';

// Mock all child components
vi.mock('@/components/builder', () => ({
  PhotoUploadZone: () => <div data-testid="photo-upload-zone">Photo Upload</div>,
  AthleteInfoFields: () => <div data-testid="athlete-info-fields">Athlete Info</div>,
  TournamentInfoFields: () => <div data-testid="tournament-info-fields">Tournament Info</div>,
  TemplateSelector: () => <div data-testid="template-selector">Template Selector</div>,
}));

vi.mock('../generate-button', () => ({
  GenerateButton: () => <div data-testid="generate-button">Generate Button</div>,
}));

vi.mock('../floating-preview-button', () => ({
  FloatingPreviewButton: () => <div data-testid="floating-preview-button">Preview Button</div>,
}));

vi.mock('../preview-modal', () => ({
  PreviewModal: () => <div data-testid="preview-modal">Preview Modal</div>,
}));

describe('PosterBuilderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PhotoUploadZone', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
  });

  it('renders AthleteInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('athlete-info-fields')).toBeInTheDocument();
  });

  it('renders TournamentInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('tournament-info-fields')).toBeInTheDocument();
  });

  it('renders TemplateSelector', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
  });

  it('renders GenerateButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
  });

  it('renders FloatingPreviewButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('floating-preview-button')).toBeInTheDocument();
  });

  it('renders PreviewModal', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('preview-modal')).toBeInTheDocument();
  });

  it('has sticky bottom container for generate button on mobile', () => {
    render(<PosterBuilderForm />);

    const generateButtonWrapper = screen.getByTestId('generate-button-wrapper');
    expect(generateButtonWrapper).toHaveClass('sticky');
    expect(generateButtonWrapper).toHaveClass('bottom-0');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`
Expected: FAIL with "Cannot find module '../poster-builder-form'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/poster-builder-form/poster-builder-form.tsx
'use client';

import {
  PhotoUploadZone,
  AthleteInfoFields,
  TournamentInfoFields,
  TemplateSelector,
} from '@/components/builder';
import { GenerateButton } from './generate-button';
import { FloatingPreviewButton } from './floating-preview-button';
import { PreviewModal } from './preview-modal';

export function PosterBuilderForm(): JSX.Element {
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
    </div>
  );
}
```

Update the index file:

```typescript
// apps/web/components/builder/poster-builder-form/index.ts
export { PosterPreviewCanvas } from './poster-preview-canvas';
export { GenerateButton } from './generate-button';
export { FloatingPreviewButton } from './floating-preview-button';
export { PreviewModal } from './preview-modal';
export { PosterBuilderForm } from './poster-builder-form';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/
git commit -m "feat(builder): add PosterBuilderForm wrapper component"
```

---

## Task 8: Update Builder Page

**Files:**
- Modify: `apps/web/app/builder/page.tsx`
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Update the builder index to export new components**

```typescript
// apps/web/components/builder/index.ts
// Add to existing exports:
export {
  PosterBuilderForm,
  GenerateButton,
  FloatingPreviewButton,
  PreviewModal,
  PosterPreviewCanvas,
} from './poster-builder-form';
```

**Step 2: Update the builder page**

```typescript
// apps/web/app/builder/page.tsx
import { PosterBuilderForm } from '@/components/builder';

export default function BuilderPage(): JSX.Element {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-3xl text-white">Create Your Poster</h1>
      <p className="mt-2 text-primary-300">Fill in the details and generate your poster</p>

      <div className="mt-8">
        <PosterBuilderForm />
      </div>
    </div>
  );
}
```

**Step 3: Run all tests to verify nothing is broken**

Run: `pnpm --filter @bjj-poster/web test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add apps/web/app/builder/page.tsx apps/web/components/builder/index.ts
git commit -m "feat(builder): integrate PosterBuilderForm into builder page"
```

---

## Task 9: Add Tailwind Animation

**Files:**
- Modify: `apps/web/tailwind.config.ts` (or `tailwind.config.js`)

**Step 1: Check if animation exists and add if needed**

Add to tailwind config's `extend.animation` and `extend.keyframes`:

```typescript
// In tailwind.config.ts, add to theme.extend:
animation: {
  // ... existing animations
  'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
},
keyframes: {
  // ... existing keyframes
  'pulse-subtle': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgba(67, 97, 238, 0.4)' },
    '50%': { boxShadow: '0 0 0 8px rgba(67, 97, 238, 0)' },
  },
},
```

**Step 2: Run the app to verify visually**

Run: `pnpm dev`
Navigate to http://localhost:3000/builder

**Step 3: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(ui): add pulse-subtle animation for floating preview button"
```

---

## Task 10: Final Integration Test

**Step 1: Run all tests**

```bash
pnpm test
```
Expected: All tests PASS

**Step 2: Run linting**

```bash
pnpm lint
```
Expected: No errors

**Step 3: Run type checking**

```bash
pnpm type-check
```
Expected: No errors

**Step 4: Manual verification**

Run: `pnpm dev`

Verify:
- [ ] Generate button is disabled when form is empty
- [ ] Generate button enables when all required fields are filled
- [ ] Floating preview button appears when any data is entered
- [ ] Floating preview button pulses when form is valid
- [ ] Preview modal opens when floating button is clicked
- [ ] Preview modal closes on ESC key
- [ ] Preview modal closes on swipe down (mobile)
- [ ] Generate button shows progress during generation
- [ ] All sections are properly laid out

---

## Summary

| Task | Component | Tests |
|------|-----------|-------|
| 1 | Mock generatePoster API | 3 |
| 2 | Store generatePoster action | 5 |
| 3 | PosterPreviewCanvas | 10 |
| 4 | GenerateButton | 10 |
| 5 | FloatingPreviewButton | 8 |
| 6 | PreviewModal | 7 |
| 7 | PosterBuilderForm | 8 |
| 8 | Builder page integration | - |
| 9 | Tailwind animation | - |
| 10 | Final verification | - |

**Total new tests: ~51**
