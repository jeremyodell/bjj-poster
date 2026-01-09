'use client';

import { useMemo, useState } from 'react';
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

  const allPosters = posters ?? [];

  // Memoize filter/sort computation to avoid recalculating on every render
  const displayedPosters = useMemo(
    () => sortPosters(filterPosters(allPosters, filter), sort),
    [allPosters, filter, sort]
  );

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

  // No posters at all - hide filter controls
  if (allPosters.length === 0) {
    return <PosterGridEmpty />;
  }

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
