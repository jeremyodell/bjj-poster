# Template Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a template selector component with recommended templates and expandable browse-all section for the poster builder.

**Architecture:** Self-contained component using `useTemplates()` for data fetching and `usePosterBuilderStore` for selection state. Recommended section shows first 3 templates; Browse All is collapsible with category filters.

**Tech Stack:** React, TanStack Query (existing hook), Zustand (existing store), Tailwind CSS, Next.js Image

---

## Task 1: TemplateSkeleton Component

**Files:**
- Create: `apps/web/components/builder/template-selector/template-skeleton.tsx`
- Test: `apps/web/components/builder/template-selector/__tests__/template-skeleton.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/components/builder/template-selector/__tests__/template-skeleton.test.tsx
import { render, screen } from '@testing-library/react';
import { TemplateSkeleton } from '../template-skeleton';

describe('TemplateSkeleton', () => {
  it('renders skeleton with correct structure', () => {
    render(<TemplateSkeleton />);

    const skeleton = screen.getByTestId('template-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders multiple skeletons when count provided', () => {
    render(<TemplateSkeleton count={3} />);

    const skeletons = screen.getAllByTestId('template-skeleton');
    expect(skeletons).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-skeleton.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/components/builder/template-selector/template-skeleton.tsx
'use client';

interface TemplateSkeletonProps {
  count?: number;
}

export function TemplateSkeleton({ count = 1 }: TemplateSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          data-testid="template-skeleton"
          className="animate-pulse rounded-lg bg-gray-700"
        >
          <div className="aspect-[3/4] w-full rounded-t-lg bg-gray-600" />
          <div className="p-3">
            <div className="h-4 w-3/4 rounded bg-gray-600" />
          </div>
        </div>
      ))}
    </>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-skeleton.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add TemplateSkeleton component"
```

---

## Task 2: TemplateCard Component - Basic Rendering

**Files:**
- Create: `apps/web/components/builder/template-selector/template-card.tsx`
- Test: `apps/web/components/builder/template-selector/__tests__/template-card.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/components/builder/template-selector/__tests__/template-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateCard } from '../template-card';

const mockTemplate = {
  id: 'tpl-001',
  name: 'Classic Tournament',
  category: 'tournament',
  thumbnailUrl: '/templates/classic.png',
};

describe('TemplateCard', () => {
  it('renders template name', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Classic Tournament')).toBeInTheDocument();
  });

  it('renders template thumbnail with alt text', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Classic Tournament' });
    expect(img).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('tpl-001');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-card.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/components/builder/template-selector/template-card.tsx
'use client';

import Image from 'next/image';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="group w-full text-left"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-700">
        <Image
          src={template.thumbnailUrl}
          alt={template.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="rounded-b-lg bg-gray-800 p-3">
        <p className="text-sm font-medium text-white">{template.name}</p>
      </div>
    </button>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-card.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add TemplateCard component with basic rendering"
```

---

## Task 3: TemplateCard Component - Selection State

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-card.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-card.test.tsx`

**Step 1: Add failing test for selection state**

Add to existing test file:

```tsx
it('shows selected state with ring and checkmark when selected', () => {
  render(
    <TemplateCard
      template={mockTemplate}
      isSelected={true}
      onSelect={vi.fn()}
    />
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('ring-2', 'ring-primary-500');
  expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument();
});

it('does not show checkmark when not selected', () => {
  render(
    <TemplateCard
      template={mockTemplate}
      isSelected={false}
      onSelect={vi.fn()}
    />
  );

  expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-card.test.tsx`
Expected: FAIL - ring classes not present, checkmark not found

**Step 3: Update implementation with selection styling**

```tsx
// apps/web/components/builder/template-selector/template-card.tsx
'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={cn(
        'group w-full rounded-lg text-left transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-gray-900',
        isSelected && 'ring-2 ring-primary-500'
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-700">
        <Image
          src={template.thumbnailUrl}
          alt={template.name}
          fill
          className="object-cover"
        />
        {isSelected && (
          <div
            data-testid="checkmark-icon"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500"
          >
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className="rounded-b-lg bg-gray-800 p-3">
        <p className="text-sm font-medium text-white">{template.name}</p>
      </div>
    </button>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-card.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add selection state to TemplateCard"
```

---

## Task 4: TemplateGrid Component

**Files:**
- Create: `apps/web/components/builder/template-selector/template-grid.tsx`
- Test: `apps/web/components/builder/template-selector/__tests__/template-grid.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/components/builder/template-selector/__tests__/template-grid.test.tsx
import { render, screen } from '@testing-library/react';
import { TemplateGrid } from '../template-grid';

describe('TemplateGrid', () => {
  it('renders children in a grid layout', () => {
    render(
      <TemplateGrid>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </TemplateGrid>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies grid classes for responsive layout', () => {
    render(
      <TemplateGrid>
        <div>Child</div>
      </TemplateGrid>
    );

    const grid = screen.getByTestId('template-grid');
    expect(grid).toHaveClass('grid');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-grid.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/components/builder/template-selector/template-grid.tsx
'use client';

import type { ReactNode } from 'react';

interface TemplateGridProps {
  children: ReactNode;
}

export function TemplateGrid({ children }: TemplateGridProps): JSX.Element {
  return (
    <div
      data-testid="template-grid"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {children}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-grid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add TemplateGrid component"
```

---

## Task 5: TemplateSelector - Loading State

**Files:**
- Create: `apps/web/components/builder/template-selector/template-selector.tsx`
- Test: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateSelector } from '../template-selector';

// Mock the hooks
vi.mock('@/lib/hooks', () => ({
  useTemplates: vi.fn(),
}));

vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: vi.fn(() => ({
    selectedTemplateId: null,
    setTemplate: vi.fn(),
  })),
}));

import { useTemplates } from '@/lib/hooks';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TemplateSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons when loading', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TemplateSelector />, { wrapper: createWrapper() });

    const skeletons = screen.getAllByTestId('template-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```tsx
// apps/web/components/builder/template-selector/template-selector.tsx
'use client';

import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const { data: templates, isLoading, isError, error, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recommended for you
          </h3>
          <TemplateGrid>
            <TemplateSkeleton count={3} />
          </TemplateGrid>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>Templates loaded</p>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add TemplateSelector with loading state"
```

---

## Task 6: TemplateSelector - Error State

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Add failing test for error state**

Add to existing test file:

```tsx
it('shows error message and retry button when error', () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error('Network error'),
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});

it('calls refetch when retry button clicked', async () => {
  const refetch = vi.fn();
  vi.mocked(useTemplates).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error('Network error'),
    refetch,
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));
  expect(refetch).toHaveBeenCalled();
});
```

Add import at top: `import userEvent from '@testing-library/user-event';`

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: FAIL - error message not found

**Step 3: Update implementation with error state**

```tsx
// apps/web/components/builder/template-selector/template-selector.tsx
'use client';

import { RefreshCw } from 'lucide-react';
import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { Button } from '@/components/ui/button';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recommended for you
          </h3>
          <TemplateGrid>
            <TemplateSkeleton count={3} />
          </TemplateGrid>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-gray-400">Failed to load templates</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>Templates loaded</p>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add error state to TemplateSelector"
```

---

## Task 7: TemplateSelector - Recommended Section

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Add failing test for recommended section**

Add to existing test file:

```tsx
const mockTemplates = [
  { id: 'tpl-001', name: 'Classic', category: 'tournament', thumbnailUrl: '/1.png' },
  { id: 'tpl-002', name: 'Modern', category: 'tournament', thumbnailUrl: '/2.png' },
  { id: 'tpl-003', name: 'Bold', category: 'competition', thumbnailUrl: '/3.png' },
  { id: 'tpl-004', name: 'Kids', category: 'kids', thumbnailUrl: '/4.png' },
];

it('displays recommended section with first 3 templates', () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  expect(screen.getByText('Recommended for you')).toBeInTheDocument();
  expect(screen.getByText('Classic')).toBeInTheDocument();
  expect(screen.getByText('Modern')).toBeInTheDocument();
  expect(screen.getByText('Bold')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: FAIL - template names not found

**Step 3: Update implementation with recommended section**

Update the return statement in template-selector.tsx:

```tsx
if (!templates || templates.length === 0) {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-400">No templates available</p>
    </div>
  );
}

const recommendedTemplates = templates.slice(0, 3);

return (
  <div className="space-y-6">
    <section>
      <h3 className="mb-4 text-lg font-semibold text-white">
        Recommended for you
      </h3>
      <TemplateGrid>
        {recommendedTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={setTemplate}
          />
        ))}
      </TemplateGrid>
    </section>
  </div>
);
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add recommended section to TemplateSelector"
```

---

## Task 8: TemplateSelector - Browse All Section (Collapsible)

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Add failing test for browse all section**

Add to existing test file:

```tsx
it('shows browse all button that expands to show all templates', async () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  const browseButton = screen.getByRole('button', { name: /browse all templates/i });
  expect(browseButton).toBeInTheDocument();

  // Fourth template should not be visible initially (only in browse all)
  expect(screen.queryByText('Kids')).not.toBeInTheDocument();

  // Click to expand
  await userEvent.click(browseButton);

  // Now all templates should be visible
  expect(screen.getByText('Kids')).toBeInTheDocument();
});

it('collapses browse all section when clicked again', async () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  const browseButton = screen.getByRole('button', { name: /browse all templates/i });

  // Expand
  await userEvent.click(browseButton);
  expect(screen.getByText('Kids')).toBeInTheDocument();

  // Collapse
  await userEvent.click(browseButton);
  expect(screen.queryByText('Kids')).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: FAIL - browse button not found

**Step 3: Update implementation with collapsible browse all**

```tsx
// apps/web/components/builder/template-selector/template-selector.tsx
'use client';

import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { Button } from '@/components/ui/button';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const [isBrowseAllOpen, setIsBrowseAllOpen] = useState(false);
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recommended for you
          </h3>
          <TemplateGrid>
            <TemplateSkeleton count={3} />
          </TemplateGrid>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-gray-400">Failed to load templates</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">No templates available</p>
      </div>
    );
  }

  const recommendedTemplates = templates.slice(0, 3);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Recommended for you
        </h3>
        <TemplateGrid>
          {recommendedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={setTemplate}
            />
          ))}
        </TemplateGrid>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setIsBrowseAllOpen(!isBrowseAllOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-gray-800 px-4 py-3 text-left text-white transition-colors hover:bg-gray-700"
        >
          <span className="font-medium">Browse all templates</span>
          {isBrowseAllOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {isBrowseAllOpen && (
          <div className="mt-4">
            <TemplateGrid>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={setTemplate}
                />
              ))}
            </TemplateGrid>
          </div>
        )}
      </section>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add collapsible browse all section"
```

---

## Task 9: Category Filters

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Add failing test for category filters**

Add to existing test file:

```tsx
it('filters templates by category when filter selected', async () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  // Expand browse all
  await userEvent.click(screen.getByRole('button', { name: /browse all templates/i }));

  // All templates visible
  expect(screen.getByText('Kids')).toBeInTheDocument();
  expect(screen.getAllByText('Classic').length).toBeGreaterThan(0);

  // Click tournament filter
  await userEvent.click(screen.getByRole('button', { name: /tournament/i }));

  // Only tournament templates visible in browse all
  expect(screen.queryByText('Kids')).not.toBeInTheDocument();
});

it('shows all templates when All filter selected', async () => {
  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  // Expand and filter
  await userEvent.click(screen.getByRole('button', { name: /browse all templates/i }));
  await userEvent.click(screen.getByRole('button', { name: /tournament/i }));

  // Click All to reset
  await userEvent.click(screen.getByRole('button', { name: /^all$/i }));

  // All templates visible again
  expect(screen.getByText('Kids')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: FAIL - filter buttons not found

**Step 3: Update implementation with category filters**

Update the browse all section in template-selector.tsx:

```tsx
// Add state at the top of the component
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// Add this before the return statement
const categories = [...new Set(templates.map((t) => t.category))];
const filteredTemplates = selectedCategory
  ? templates.filter((t) => t.category === selectedCategory)
  : templates;

// Update the browse all section:
{isBrowseAllOpen && (
  <div className="mt-4 space-y-4">
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setSelectedCategory(null)}
        className={cn(
          'rounded-full px-3 py-1 text-sm font-medium transition-colors',
          selectedCategory === null
            ? 'bg-primary-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => setSelectedCategory(category)}
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors',
            selectedCategory === category
              ? 'bg-primary-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          {category}
        </button>
      ))}
    </div>
    <TemplateGrid>
      {filteredTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplateId === template.id}
          onSelect={setTemplate}
        />
      ))}
    </TemplateGrid>
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "feat(web): add category filters to browse all section"
```

---

## Task 10: Template Selection Integration

**Files:**
- Modify: `apps/web/components/builder/template-selector/__tests__/template-selector.test.tsx`

**Step 1: Add test for template selection updating store**

Add to existing test file:

```tsx
it('updates store when template selected', async () => {
  const setTemplate = vi.fn();
  vi.mocked(usePosterBuilderStore).mockReturnValue({
    selectedTemplateId: null,
    setTemplate,
  });

  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  await userEvent.click(screen.getByText('Classic'));
  expect(setTemplate).toHaveBeenCalledWith('tpl-001');
});

it('shows selected template with visual indicator', () => {
  vi.mocked(usePosterBuilderStore).mockReturnValue({
    selectedTemplateId: 'tpl-001',
    setTemplate: vi.fn(),
  });

  vi.mocked(useTemplates).mockReturnValue({
    data: mockTemplates,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(<TemplateSelector />, { wrapper: createWrapper() });

  expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument();
});
```

Update mock at top to use vi.mocked properly:

```tsx
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';

vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: vi.fn(),
}));

// In beforeEach:
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usePosterBuilderStore).mockReturnValue({
    selectedTemplateId: null,
    setTemplate: vi.fn(),
  });
});
```

**Step 2: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/template-selector/__tests__/template-selector.test.tsx`
Expected: PASS (implementation already supports this)

**Step 3: Commit**

```bash
git add apps/web/components/builder/template-selector/
git commit -m "test(web): add template selection integration tests"
```

---

## Task 11: Export and Index File

**Files:**
- Create: `apps/web/components/builder/template-selector/index.ts`
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Create index file**

```tsx
// apps/web/components/builder/template-selector/index.ts
export { TemplateSelector } from './template-selector';
export { TemplateCard } from './template-card';
export { TemplateGrid } from './template-grid';
export { TemplateSkeleton } from './template-skeleton';
```

**Step 2: Update builder index**

Add to `apps/web/components/builder/index.ts`:

```tsx
export { TemplateSelector } from './template-selector';
```

**Step 3: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/components/builder/
git commit -m "feat(web): export TemplateSelector from builder components"
```

---

## Task 12: Integrate with Builder Page

**Files:**
- Modify: `apps/web/app/builder/page.tsx`

**Step 1: Update builder page**

```tsx
// apps/web/app/builder/page.tsx
import { TemplateSelector } from '@/components/builder';

export default function BuilderPage(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-white">Create Your Poster</h1>
      <p className="mt-2 text-primary-300">
        Choose a template to get started
      </p>

      <div className="mt-8">
        <TemplateSelector />
      </div>
    </div>
  );
}
```

**Step 2: Run dev server and verify**

Run: `pnpm dev`
Navigate to: http://localhost:3000/builder
Expected: Template selector renders with recommended templates

**Step 3: Commit**

```bash
git add apps/web/app/builder/page.tsx
git commit -m "feat(web): integrate TemplateSelector into builder page"
```

---

## Task 13: Final Verification

**Step 1: Run all tests**

Run: `pnpm --filter @bjj-poster/web test`
Expected: All tests pass

**Step 2: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm --filter @bjj-poster/web lint`
Expected: No errors

**Step 4: Manual verification**

Checklist:
- [ ] 3 recommended templates display
- [ ] Template selection highlights card with blue ring and checkmark
- [ ] "Browse all" expands/collapses
- [ ] Template grid is responsive (1 col mobile, 2 tablet, 3 desktop)
- [ ] Loading state shows skeletons
- [ ] Category filters work in browse all section
- [ ] Selected template persists in Zustand store

---

## Summary

| Task | Component | Description |
|------|-----------|-------------|
| 1 | TemplateSkeleton | Loading placeholder |
| 2-3 | TemplateCard | Card with selection state |
| 4 | TemplateGrid | Responsive grid layout |
| 5-9 | TemplateSelector | Main component with all states |
| 10 | Tests | Integration tests |
| 11 | Exports | Index files |
| 12 | Integration | Builder page |
| 13 | Verification | Final checks |
