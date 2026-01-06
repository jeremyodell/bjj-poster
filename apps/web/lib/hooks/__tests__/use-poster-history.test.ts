import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createWrapper } from './test-utils';

vi.mock('../../api/posters', () => ({
  fetchPosterHistory: vi.fn(),
}));

describe('usePosterHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state when userId provided', async () => {
    const { fetchPosterHistory } = await import('../../api/posters');
    vi.mocked(fetchPosterHistory).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { usePosterHistory } = await import('../use-poster-history');

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when userId is undefined', async () => {
    const { fetchPosterHistory } = await import('../../api/posters');

    const { usePosterHistory } = await import('../use-poster-history');

    const { result } = renderHook(() => usePosterHistory(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchPosterHistory).not.toHaveBeenCalled();
  });

  it('returns poster data on success', async () => {
    const mockPosters = [
      {
        id: 'p1',
        templateId: 't1',
        createdAt: '2026-01-01',
        thumbnailUrl: '/p1.png',
        title: 'Test Poster',
      },
    ];
    const { fetchPosterHistory } = await import('../../api/posters');
    vi.mocked(fetchPosterHistory).mockResolvedValue(mockPosters);

    const { usePosterHistory } = await import('../use-poster-history');

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPosters);
    expect(fetchPosterHistory).toHaveBeenCalledWith('user-001');
  });

  it('returns error state on failure', async () => {
    const { fetchPosterHistory } = await import('../../api/posters');
    vi.mocked(fetchPosterHistory).mockRejectedValue(new Error('Network error'));

    const { usePosterHistory } = await import('../use-poster-history');

    const { result } = renderHook(() => usePosterHistory('user-001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});
