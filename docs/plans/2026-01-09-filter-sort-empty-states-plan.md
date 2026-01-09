# Filter, Sort, and Empty States Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add filter and sort controls to the poster grid with improved empty states for filtered results.

**Architecture:** FilterSort component renders inside PosterGrid with local React state. Pure utility functions handle filtering and sorting logic, applied before rendering the grid. Two empty states: one for no posters at all (hide filters), one for no filter matches (show filters + clear button).

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## Task 1: Filter Utility Function

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/filter-sort-utils.ts`
- Test: `apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterPosters } from '../poster-grid/filter-sort-utils';
import type { Poster } from '@/lib/types/api';

const createPoster = (overrides: Partial<Poster> = {}): Poster => ({
  id: 'poster-001',
  templateId: 'tpl-001',
  createdAt: '2026-01-05T10:00:00Z',
  thumbnailUrl: '/posters/poster-001.png',
  athleteName: 'Test Athlete',
  tournament: 'Test Tournament',
  beltRank: 'Purple Belt',
  status: 'completed',
  ...overrides,
});

describe('filterPosters', () => {
  const posters: Poster[] = [
    createPoster({ id: '1', beltRank: 'White Belt', createdAt: '2026-01-08T10:00:00Z' }),
    createPoster({ id: '2', beltRank: 'Blue Belt', createdAt: '2026-01-05T10:00:00Z' }),
    createPoster({ id: '3', beltRank: 'Purple Belt', createdAt: '2026-01-01T10:00:00Z' }),
    createPoster({ id: '4', beltRank: 'Brown Belt', createdAt: '2025-12-20T10:00:00Z' }),
    createPoster({ id: '5', beltRank: 'Black Belt', createdAt: '2025-12-01T10:00:00Z' }),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-09T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns all posters when filter is "all"', () => {
    const result = filterPosters(posters, 'all');
    expect(result).toHaveLength(5);
  });

  it('returns posters from last 7 days when filter is "recent"', () => {
    const result = filterPosters(posters, 'recent');
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('filters by white belt', () => {
    const result = filterPosters(posters, 'white');
    expect(result).toHaveLength(1);
    expect(result[0].beltRank).toBe('White Belt');
  });

  it('filters by blue belt', () => {
    const result = filterPosters(posters, 'blue');
    expect(result).toHaveLength(1);
    expect(result[0].beltRank).toBe('Blue Belt');
  });

  it('filters by purple belt', () => {
    const result = filterPosters(posters, 'purple');
    expect(result).toHaveLength(1);
    expect(result[0].beltRank).toBe('Purple Belt');
  });

  it('filters by brown belt', () => {
    const result = filterPosters(posters, 'brown');
    expect(result).toHaveLength(1);
    expect(result[0].beltRank).toBe('Brown Belt');
  });

  it('filters by black belt', () => {
    const result = filterPosters(posters, 'black');
    expect(result).toHaveLength(1);
    expect(result[0].beltRank).toBe('Black Belt');
  });

  it('returns empty array when no matches', () => {
    const whiteBeltOnly = [createPoster({ beltRank: 'White Belt' })];
    const result = filterPosters(whiteBeltOnly, 'black');
    expect(result).toHaveLength(0);
  });

  it('handles empty poster array', () => {
    const result = filterPosters([], 'all');
    expect(result).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test filter-sort-utils`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/dashboard/poster-grid/filter-sort-utils.ts
import type { Poster } from '@/lib/types/api';

export type FilterOption = 'all' | 'recent' | 'white' | 'blue' | 'purple' | 'brown' | 'black';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function filterPosters(posters: Poster[], filter: FilterOption): Poster[] {
  switch (filter) {
    case 'all':
      return posters;
    case 'recent': {
      const cutoff = Date.now() - SEVEN_DAYS_MS;
      return posters.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
    }
    default: {
      // Belt rank filters
      const beltMap: Record<string, string> = {
        white: 'White Belt',
        blue: 'Blue Belt',
        purple: 'Purple Belt',
        brown: 'Brown Belt',
        black: 'Black Belt',
      };
      return posters.filter((p) => p.beltRank === beltMap[filter]);
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test filter-sort-utils`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/filter-sort-utils.ts apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts
git commit -m "feat(dashboard): add filterPosters utility function (ODE-74)"
```

---

## Task 2: Sort Utility Function

**Files:**
- Modify: `apps/web/components/dashboard/poster-grid/filter-sort-utils.ts`
- Modify: `apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts`

**Step 1: Write the failing tests**

Add to `filter-sort-utils.test.ts`:

```typescript
import { filterPosters, sortPosters } from '../poster-grid/filter-sort-utils';

// ... existing tests ...

describe('sortPosters', () => {
  const posters: Poster[] = [
    createPoster({ id: '1', tournament: 'Alpha Cup', createdAt: '2026-01-05T10:00:00Z' }),
    createPoster({ id: '2', tournament: 'Zebra Open', createdAt: '2026-01-08T10:00:00Z' }),
    createPoster({ id: '3', tournament: 'Beta Championship', createdAt: '2026-01-01T10:00:00Z' }),
  ];

  it('sorts by newest first (default)', () => {
    const result = sortPosters(posters, 'newest');
    expect(result.map((p) => p.id)).toEqual(['2', '1', '3']);
  });

  it('sorts by oldest first', () => {
    const result = sortPosters(posters, 'oldest');
    expect(result.map((p) => p.id)).toEqual(['3', '1', '2']);
  });

  it('sorts alphabetically by tournament name', () => {
    const result = sortPosters(posters, 'a-z');
    expect(result.map((p) => p.tournament)).toEqual([
      'Alpha Cup',
      'Beta Championship',
      'Zebra Open',
    ]);
  });

  it('does not mutate original array', () => {
    const original = [...posters];
    sortPosters(posters, 'oldest');
    expect(posters).toEqual(original);
  });

  it('handles empty array', () => {
    const result = sortPosters([], 'newest');
    expect(result).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test filter-sort-utils`
Expected: FAIL - sortPosters not exported

**Step 3: Write minimal implementation**

Add to `filter-sort-utils.ts`:

```typescript
export type SortOption = 'newest' | 'oldest' | 'a-z';

export function sortPosters(posters: Poster[], sort: SortOption): Poster[] {
  const sorted = [...posters];
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case 'a-z':
      return sorted.sort((a, b) => a.tournament.localeCompare(b.tournament));
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test filter-sort-utils`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/filter-sort-utils.ts apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts
git commit -m "feat(dashboard): add sortPosters utility function (ODE-74)"
```

---

## Task 3: FilterSort Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/filter-sort.tsx`
- Create: `apps/web/components/dashboard/__tests__/filter-sort.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/dashboard/__tests__/filter-sort.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSort } from '../poster-grid/filter-sort';

describe('FilterSort', () => {
  const defaultProps = {
    filter: 'all' as const,
    sort: 'newest' as const,
    onFilterChange: vi.fn(),
    onSortChange: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders filter select with correct value', () => {
    render(<FilterSort {...defaultProps} filter="recent" />);

    const filterSelect = screen.getByLabelText(/filter/i);
    expect(filterSelect).toHaveValue('recent');
  });

  it('renders sort select with correct value', () => {
    render(<FilterSort {...defaultProps} sort="oldest" />);

    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toHaveValue('oldest');
  });

  it('renders all filter options', () => {
    render(<FilterSort {...defaultProps} />);

    const filterSelect = screen.getByLabelText(/filter/i);
    expect(filterSelect).toContainHTML('All');
    expect(filterSelect).toContainHTML('Recent');
    expect(filterSelect).toContainHTML('White Belt');
    expect(filterSelect).toContainHTML('Blue Belt');
    expect(filterSelect).toContainHTML('Purple Belt');
    expect(filterSelect).toContainHTML('Brown Belt');
    expect(filterSelect).toContainHTML('Black Belt');
  });

  it('renders all sort options', () => {
    render(<FilterSort {...defaultProps} />);

    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toContainHTML('Newest');
    expect(sortSelect).toContainHTML('Oldest');
    expect(sortSelect).toContainHTML('A-Z');
  });

  it('calls onFilterChange when filter changes', () => {
    const onFilterChange = vi.fn();
    render(<FilterSort {...defaultProps} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'purple' } });

    expect(onFilterChange).toHaveBeenCalledWith('purple');
  });

  it('calls onSortChange when sort changes', () => {
    const onSortChange = vi.fn();
    render(<FilterSort {...defaultProps} onSortChange={onSortChange} />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    expect(onSortChange).toHaveBeenCalledWith('a-z');
  });

  it('hides clear button when no active filters', () => {
    render(<FilterSort {...defaultProps} filter="all" sort="newest" />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows clear button when filter is active', () => {
    render(<FilterSort {...defaultProps} filter="purple" />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('shows clear button when sort is not default', () => {
    render(<FilterSort {...defaultProps} sort="oldest" />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    render(<FilterSort {...defaultProps} filter="purple" onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test filter-sort.test`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/dashboard/poster-grid/filter-sort.tsx
import type { FilterOption, SortOption } from './filter-sort-utils';

interface FilterSortProps {
  filter: FilterOption;
  sort: SortOption;
  onFilterChange: (filter: FilterOption) => void;
  onSortChange: (sort: SortOption) => void;
  onClear: () => void;
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
  { value: 'white', label: 'White Belt' },
  { value: 'blue', label: 'Blue Belt' },
  { value: 'purple', label: 'Purple Belt' },
  { value: 'brown', label: 'Brown Belt' },
  { value: 'black', label: 'Black Belt' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'a-z', label: 'A-Z' },
];

export function FilterSort({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onClear,
}: FilterSortProps): JSX.Element {
  const hasActiveFilters = filter !== 'all' || sort !== 'newest';

  const selectClassName =
    'rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-surface-400">Filter</span>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as FilterOption)}
            className={selectClassName}
            aria-label="Filter"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-surface-400">Sort</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={selectClassName}
            aria-label="Sort"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test filter-sort.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/filter-sort.tsx apps/web/components/dashboard/__tests__/filter-sort.test.tsx
git commit -m "feat(dashboard): add FilterSort component (ODE-74)"
```

---

## Task 4: PosterGridFilteredEmpty Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-grid-filtered-empty.tsx`
- Create: `apps/web/components/dashboard/__tests__/poster-grid-filtered-empty.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/dashboard/__tests__/poster-grid-filtered-empty.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridFilteredEmpty } from '../poster-grid/poster-grid-filtered-empty';

describe('PosterGridFilteredEmpty', () => {
  it('renders empty state message', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByText(/no posters match/i)).toBeInTheDocument();
  });

  it('renders clear filters button', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('calls onClear when button clicked', () => {
    const onClear = vi.fn();
    render(<PosterGridFilteredEmpty onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('renders search icon', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByTestId('filtered-empty-icon')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test poster-grid-filtered-empty`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/dashboard/poster-grid/poster-grid-filtered-empty.tsx
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosterGridFilteredEmptyProps {
  onClear: () => void;
}

export function PosterGridFilteredEmpty({ onClear }: PosterGridFilteredEmptyProps): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-900/30 p-8">
      <SearchX
        data-testid="filtered-empty-icon"
        className="mb-4 h-16 w-16 text-surface-600"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        No posters match your filters
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Try adjusting your filter or sort options.
      </p>

      <Button onClick={onClear}>Clear filters</Button>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test poster-grid-filtered-empty`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-grid-filtered-empty.tsx apps/web/components/dashboard/__tests__/poster-grid-filtered-empty.test.tsx
git commit -m "feat(dashboard): add PosterGridFilteredEmpty component (ODE-74)"
```

---

## Task 5: Integrate FilterSort into PosterGrid

**Files:**
- Modify: `apps/web/components/dashboard/poster-grid/poster-grid.tsx`
- Modify: `apps/web/components/dashboard/__tests__/poster-grid.test.tsx`

**Step 1: Write the failing tests**

Add to `poster-grid.test.tsx`:

```typescript
// Add new imports at top
import { within } from '@testing-library/react';

// Add to existing describe block:

describe('PosterGrid with filter/sort', () => {
  const postersForFiltering = [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-08T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      athleteName: 'Marcus Silva',
      tournament: 'Alpha Championship',
      beltRank: 'Purple Belt',
      status: 'completed',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-05T10:00:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      athleteName: 'Sofia Chen',
      tournament: 'Beta Open',
      beltRank: 'Blue Belt',
      status: 'completed',
    },
    {
      id: 'poster-003',
      templateId: 'tpl-003',
      createdAt: '2025-12-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-003.png',
      athleteName: 'James Lee',
      tournament: 'Gamma Cup',
      beltRank: 'Black Belt',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-09T12:00:00Z'));
    mockUsePosterHistory.mockReturnValue({
      data: postersForFiltering,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders filter and sort controls when posters exist', () => {
    render(<PosterGrid />);

    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });

  it('does not render filter controls when no posters', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.queryByLabelText(/filter/i)).not.toBeInTheDocument();
  });

  it('filters posters by belt rank', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'blue' } });

    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Championship')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Cup')).not.toBeInTheDocument();
  });

  it('filters posters by recent', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'recent' } });

    expect(screen.getByText('Alpha Championship')).toBeInTheDocument();
    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.queryByText('Gamma Cup')).not.toBeInTheDocument();
  });

  it('sorts posters alphabetically', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Alpha Championship');
    expect(titles[1]).toHaveTextContent('Beta Open');
    expect(titles[2]).toHaveTextContent('Gamma Cup');
  });

  it('sorts posters by oldest', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'oldest' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Gamma Cup');
  });

  it('shows filtered empty state when no matches', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    expect(screen.getByText(/no posters match/i)).toBeInTheDocument();
  });

  it('shows clear filters button with filtered empty state', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('clears filters and shows all posters', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(screen.getByText('Alpha Championship')).toBeInTheDocument();
    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.getByText('Gamma Cup')).toBeInTheDocument();
  });

  it('combines filter and sort', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'recent' } });
    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles).toHaveLength(2);
    expect(titles[0]).toHaveTextContent('Alpha Championship');
    expect(titles[1]).toHaveTextContent('Beta Open');
  });

  it('keeps filter controls visible when filtered empty', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test poster-grid.test`
Expected: FAIL - filter controls not rendered

**Step 3: Write minimal implementation**

Update `poster-grid.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { usePosterHistory } from '@/lib/hooks';
import { useUserStore } from '@/lib/stores';
import { PosterCard } from './poster-card';
import { PosterCardSkeleton } from './poster-card-skeleton';
import { PosterGridEmpty } from './poster-grid-empty';
import { PosterGridError } from './poster-grid-error';
import { PosterGridFilteredEmpty } from './poster-grid-filtered-empty';
import { FilterSort } from './filter-sort';
import { filterPosters, sortPosters } from './filter-sort-utils';
import type { FilterOption, SortOption } from './filter-sort-utils';

export function PosterGrid(): JSX.Element {
  const user = useUserStore((state) => state.user);
  const { data: posters, isLoading, isError, refetch } = usePosterHistory(user?.id);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const clearFilters = (): void => {
    setFilter('all');
    setSort('newest');
  };

  if (isLoading) {
    return (
      <div
        data-testid="poster-grid"
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <PosterGridError onRetry={refetch} />;
  }

  const allPosters = posters ?? [];

  // No posters at all - hide filter controls
  if (allPosters.length === 0) {
    return <PosterGridEmpty />;
  }

  const displayedPosters = sortPosters(filterPosters(allPosters, filter), sort);

  // Has posters but none match filters
  if (displayedPosters.length === 0) {
    return (
      <>
        <FilterSort
          filter={filter}
          sort={sort}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onClear={clearFilters}
        />
        <PosterGridFilteredEmpty onClear={clearFilters} />
      </>
    );
  }

  return (
    <>
      <FilterSort
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onClear={clearFilters}
      />
      <div
        data-testid="poster-grid"
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {displayedPosters.map((poster) => (
          <PosterCard key={poster.id} poster={poster} />
        ))}
      </div>
    </>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test poster-grid.test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-grid.tsx apps/web/components/dashboard/__tests__/poster-grid.test.tsx
git commit -m "feat(dashboard): integrate filter/sort into PosterGrid (ODE-74)"
```

---

## Task 6: Export New Components

**Files:**
- Modify: `apps/web/components/dashboard/poster-grid/index.ts`

**Step 1: Update exports**

```typescript
// apps/web/components/dashboard/poster-grid/index.ts
export { PosterGrid } from './poster-grid';
export { PosterCard } from './poster-card';
export { PosterCardSkeleton } from './poster-card-skeleton';
export { PosterGridEmpty } from './poster-grid-empty';
export { PosterGridError } from './poster-grid-error';
export { PosterGridFilteredEmpty } from './poster-grid-filtered-empty';
export { FilterSort } from './filter-sort';
export { ShareModal } from './share-modal';
export { filterPosters, sortPosters } from './filter-sort-utils';
export type { FilterOption, SortOption } from './filter-sort-utils';
```

**Step 2: Run all tests**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

**Step 3: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 4: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/index.ts
git commit -m "feat(dashboard): export filter/sort components (ODE-74)"
```

---

## Task 7: Final Verification

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 4: Manual smoke test (optional)**

Run: `pnpm dev`
- Navigate to dashboard
- Verify filter dropdown works
- Verify sort dropdown works
- Verify clear filters button appears and works
- Verify filtered empty state displays correctly

---

## Files Summary

| Action | File |
|--------|------|
| Create | `apps/web/components/dashboard/poster-grid/filter-sort-utils.ts` |
| Create | `apps/web/components/dashboard/poster-grid/filter-sort.tsx` |
| Create | `apps/web/components/dashboard/poster-grid/poster-grid-filtered-empty.tsx` |
| Create | `apps/web/components/dashboard/__tests__/filter-sort-utils.test.ts` |
| Create | `apps/web/components/dashboard/__tests__/filter-sort.test.tsx` |
| Create | `apps/web/components/dashboard/__tests__/poster-grid-filtered-empty.test.tsx` |
| Modify | `apps/web/components/dashboard/poster-grid/poster-grid.tsx` |
| Modify | `apps/web/components/dashboard/__tests__/poster-grid.test.tsx` |
| Modify | `apps/web/components/dashboard/poster-grid/index.ts` |
