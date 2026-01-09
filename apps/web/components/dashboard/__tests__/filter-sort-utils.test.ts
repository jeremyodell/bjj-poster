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
