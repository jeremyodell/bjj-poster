import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  filterPosters,
  sortPosters,
  isValidFilterOption,
  isValidSortOption,
} from '../poster-grid/filter-sort-utils';
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
    expect(result[0]?.beltRank).toBe('White Belt');
  });

  it('filters by blue belt', () => {
    const result = filterPosters(posters, 'blue');
    expect(result).toHaveLength(1);
    expect(result[0]?.beltRank).toBe('Blue Belt');
  });

  it('filters by purple belt', () => {
    const result = filterPosters(posters, 'purple');
    expect(result).toHaveLength(1);
    expect(result[0]?.beltRank).toBe('Purple Belt');
  });

  it('filters by brown belt', () => {
    const result = filterPosters(posters, 'brown');
    expect(result).toHaveLength(1);
    expect(result[0]?.beltRank).toBe('Brown Belt');
  });

  it('filters by black belt', () => {
    const result = filterPosters(posters, 'black');
    expect(result).toHaveLength(1);
    expect(result[0]?.beltRank).toBe('Black Belt');
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

  it('sorts case-insensitively by tournament name', () => {
    const mixedCase: Poster[] = [
      createPoster({ id: '1', tournament: 'zebra Open' }),
      createPoster({ id: '2', tournament: 'Alpha Cup' }),
      createPoster({ id: '3', tournament: 'BETA Championship' }),
    ];
    const result = sortPosters(mixedCase, 'a-z');
    expect(result.map((p) => p.tournament)).toEqual([
      'Alpha Cup',
      'BETA Championship',
      'zebra Open',
    ]);
  });
});

describe('filterPosters edge cases', () => {
  it('handles case-insensitive belt rank matching', () => {
    const mixedCase: Poster[] = [
      createPoster({ id: '1', beltRank: 'white belt' }),
      createPoster({ id: '2', beltRank: 'WHITE BELT' }),
      createPoster({ id: '3', beltRank: 'White Belt' }),
    ];
    const result = filterPosters(mixedCase, 'white');
    expect(result).toHaveLength(3);
  });

  it('handles posters with undefined beltRank', () => {
    const postersWithMissing = [
      createPoster({ id: '1', beltRank: 'White Belt' }),
      createPoster({ id: '2', beltRank: undefined as unknown as string }),
    ];
    const result = filterPosters(postersWithMissing, 'white');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });
});

describe('isValidFilterOption', () => {
  it('returns true for valid filter options', () => {
    expect(isValidFilterOption('all')).toBe(true);
    expect(isValidFilterOption('recent')).toBe(true);
    expect(isValidFilterOption('white')).toBe(true);
    expect(isValidFilterOption('blue')).toBe(true);
    expect(isValidFilterOption('purple')).toBe(true);
    expect(isValidFilterOption('brown')).toBe(true);
    expect(isValidFilterOption('black')).toBe(true);
  });

  it('returns false for invalid filter options', () => {
    expect(isValidFilterOption('invalid')).toBe(false);
    expect(isValidFilterOption('')).toBe(false);
    expect(isValidFilterOption('ALL')).toBe(false);
    expect(isValidFilterOption('Red Belt')).toBe(false);
  });
});

describe('isValidSortOption', () => {
  it('returns true for valid sort options', () => {
    expect(isValidSortOption('newest')).toBe(true);
    expect(isValidSortOption('oldest')).toBe(true);
    expect(isValidSortOption('a-z')).toBe(true);
  });

  it('returns false for invalid sort options', () => {
    expect(isValidSortOption('invalid')).toBe(false);
    expect(isValidSortOption('')).toBe(false);
    expect(isValidSortOption('z-a')).toBe(false);
    expect(isValidSortOption('NEWEST')).toBe(false);
  });
});
