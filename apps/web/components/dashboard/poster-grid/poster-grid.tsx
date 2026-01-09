'use client';

import { usePosterHistory } from '@/lib/hooks';
import { useUserStore } from '@/lib/stores';
import { PosterCard } from './poster-card';
import { PosterCardSkeleton } from './poster-card-skeleton';
import { PosterGridEmpty } from './poster-grid-empty';
import { PosterGridError } from './poster-grid-error';

export function PosterGrid(): JSX.Element {
  const user = useUserStore((state) => state.user);
  const { data: posters, isLoading, isError, refetch } = usePosterHistory(user?.id);

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

  if (!posters?.length) {
    return <PosterGridEmpty />;
  }

  return (
    <div
      data-testid="poster-grid"
      className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      {posters.map((poster) => (
        <PosterCard key={poster.id} poster={poster} />
      ))}
    </div>
  );
}
