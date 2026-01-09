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
