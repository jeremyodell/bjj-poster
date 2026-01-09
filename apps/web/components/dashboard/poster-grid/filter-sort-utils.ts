import type { Poster } from '@/lib/types/api';

export type FilterOption = 'all' | 'recent' | 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type SortOption = 'newest' | 'oldest' | 'a-z';

/** Number of days to consider a poster as "recent" */
const RECENT_DAYS = 7;
const RECENT_MS = RECENT_DAYS * 24 * 60 * 60 * 1000;

/** Belt rank filter values mapped to display names */
const BELT_RANK_MAP: Record<string, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  purple: 'Purple Belt',
  brown: 'Brown Belt',
  black: 'Black Belt',
} as const;

/** Valid filter option values for runtime validation */
const VALID_FILTER_OPTIONS: FilterOption[] = [
  'all',
  'recent',
  'white',
  'blue',
  'purple',
  'brown',
  'black',
];

/** Valid sort option values for runtime validation */
const VALID_SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'a-z'];

/**
 * Type guard to validate if a string is a valid FilterOption.
 * @param value - The value to check
 * @returns True if the value is a valid FilterOption
 */
export function isValidFilterOption(value: string): value is FilterOption {
  return VALID_FILTER_OPTIONS.includes(value as FilterOption);
}

/**
 * Type guard to validate if a string is a valid SortOption.
 * @param value - The value to check
 * @returns True if the value is a valid SortOption
 */
export function isValidSortOption(value: string): value is SortOption {
  return VALID_SORT_OPTIONS.includes(value as SortOption);
}

/**
 * Filters posters by belt rank or recency.
 * @param posters - Array of posters to filter
 * @param filter - Filter option to apply ('all', 'recent', or belt rank)
 * @returns Filtered array of posters
 */
export function filterPosters(posters: Poster[], filter: FilterOption): Poster[] {
  switch (filter) {
    case 'all':
      return posters;
    case 'recent': {
      const cutoff = Date.now() - RECENT_MS;
      return posters.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
    }
    case 'white':
    case 'blue':
    case 'purple':
    case 'brown':
    case 'black': {
      const beltValue = BELT_RANK_MAP[filter];
      return posters.filter(
        (p) => p.beltRank?.toLowerCase() === beltValue?.toLowerCase()
      );
    }
  }
}

/**
 * Sorts posters by date or tournament name.
 * @param posters - Array of posters to sort
 * @param sort - Sort option to apply ('newest', 'oldest', or 'a-z')
 * @returns New sorted array (does not mutate original)
 */
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
      return sorted.sort((a, b) =>
        a.tournament.localeCompare(b.tournament, undefined, { sensitivity: 'base' })
      );
  }
}
