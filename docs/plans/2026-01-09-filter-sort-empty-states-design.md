# Filter, Sort, and Empty States Design

**Issue:** ODE-74 - UI-DSH-004
**Date:** 2026-01-09
**Status:** Approved

## Overview

Add filter and sort controls to the poster grid with improved empty states.

## Component Architecture

### New Component: `FilterSort`

Location: `apps/web/components/dashboard/poster-grid/filter-sort.tsx`

```
PosterGrid (existing)
├── FilterSort (new)
│   ├── Filter <select>
│   │   Options: All, Recent, White, Blue, Purple, Brown, Black
│   ├── Sort <select>
│   │   Options: Newest, Oldest, A-Z
│   └── Clear Filters <button> (conditional)
├── Loading state (skeletons)
├── Error state
├── Empty state (enhanced)
│   ├── PosterGridEmpty (no posters at all)
│   └── PosterGridFilteredEmpty (new - no filter results)
└── PosterCard grid
```

### State Management

Local component state in PosterGrid (not Zustand):

```typescript
const [filter, setFilter] = useState<FilterOption>('all');
const [sort, setSort] = useState<SortOption>('newest');
```

### Data Flow

1. `usePosterHistory` fetches all posters (unchanged)
2. `filterPosters(posters, filter)` applies filter
3. `sortPosters(filteredPosters, sort)` applies sort
4. Result rendered as PosterCard grid

## Types

```typescript
type FilterOption = 'all' | 'recent' | 'white' | 'blue' | 'purple' | 'brown' | 'black';
type SortOption = 'newest' | 'oldest' | 'a-z';
```

## Filter Logic

```typescript
function filterPosters(posters: Poster[], filter: FilterOption): Poster[] {
  switch (filter) {
    case 'all':
      return posters;
    case 'recent':
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return posters.filter(p => new Date(p.createdAt).getTime() >= sevenDaysAgo);
    default:
      // Belt rank filters (white, blue, purple, brown, black)
      return posters.filter(p => p.beltRank.toLowerCase() === filter);
  }
}
```

## Sort Logic

```typescript
function sortPosters(posters: Poster[], sort: SortOption): Poster[] {
  const sorted = [...posters];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'a-z':
      return sorted.sort((a, b) => a.tournament.localeCompare(b.tournament));
  }
}
```

## UI Layout

### Desktop (sm+)

```
┌─────────────────────────────────────────────────────────┐
│ [Filter ▼]  [Sort ▼]                    [Clear filters] │
└─────────────────────────────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────────────────────────────────────┐
│ [Filter ▼]                                              │
│ [Sort ▼]                                                │
│ [Clear filters]                                         │
└─────────────────────────────────────────────────────────┘
```

### Tailwind Structure

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
    <select>Filter options</select>
    <select>Sort options</select>
  </div>
  {hasActiveFilters && (
    <button className="text-sm text-blue-600 hover:underline">
      Clear filters
    </button>
  )}
</div>
```

## Empty States

### No Posters At All (existing `PosterGridEmpty`)

- Message: "No posters yet. Create your first!"
- Link to poster builder
- FilterSort component is **hidden**

### No Filter Results (new `PosterGridFilteredEmpty`)

- Message: "No posters match your filters."
- "Clear filters" button inline
- FilterSort component remains **visible**

### Logic

```typescript
const allPosters = data ?? [];
const displayedPosters = sortPosters(filterPosters(allPosters, filter), sort);
const hasActiveFilters = filter !== 'all' || sort !== 'newest';

if (allPosters.length === 0) return <PosterGridEmpty />;
if (displayedPosters.length === 0) return (
  <>
    <FilterSort ... />
    <PosterGridFilteredEmpty onClear={clearFilters} />
  </>
);
```

## Test Approach

1. `filterPosters` - unit tests for each filter option
2. `sortPosters` - unit tests for each sort option
3. `FilterSort` component - renders dropdowns, calls onChange
4. `PosterGrid` integration - filter/sort state updates grid
5. Empty states - correct state shown based on data + filters
6. Clear filters - resets to defaults

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| FilterSort placement | Inside PosterGrid | Self-contained, matches "local state" requirement |
| Belt rank filter | Flat dropdown options | Simpler UX than nested menus |
| UI components | Native HTML selects | Accessible, fast, appropriate for utility controls |
