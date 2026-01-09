import type { Poster } from '@/lib/types/api';

export type FilterOption = 'all' | 'recent' | 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type SortOption = 'newest' | 'oldest' | 'a-z';

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
