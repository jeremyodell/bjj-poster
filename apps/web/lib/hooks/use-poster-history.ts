import { useQuery } from '@tanstack/react-query';
import { fetchPosterHistory } from '../api/posters';
import { queryKeys } from '../api/query-keys';
import type { Poster } from '../types/api';

/**
 * Fetches poster history for a specific user
 * Query key: ['posters', userId] when enabled, ['posters', '__DISABLED__'] when disabled
 * Only fetches when userId is provided (enabled guard guarantees userId is defined in queryFn)
 */
export function usePosterHistory(userId: string | undefined) {
  return useQuery<Poster[], Error>({
    queryKey: queryKeys.posters.byUser(userId),
    // enabled guard guarantees userId is defined when queryFn executes
    queryFn: () => fetchPosterHistory(userId!),
    enabled: !!userId,
  });
}
