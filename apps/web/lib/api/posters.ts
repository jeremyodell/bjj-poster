import type { Poster } from '../types/api';

const MOCK_POSTERS: Record<string, Poster[]> = {
  'user-001': [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      athleteName: 'Marcus Silva',
      tournament: 'Spring Championship 2026',
      beltRank: 'Purple Belt',
      status: 'completed',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-03T14:30:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      athleteName: 'Sofia Chen',
      tournament: 'Kids Open Mat',
      beltRank: 'Blue Belt',
      status: 'completed',
    },
    {
      id: 'poster-003',
      templateId: 'tpl-001',
      createdAt: '2026-01-05T09:15:00Z',
      thumbnailUrl: '/posters/poster-003.png',
      athleteName: 'Jake Thompson',
      tournament: 'Regional Qualifiers',
      beltRank: 'Brown Belt',
      status: 'draft',
    },
  ],
};

/**
 * Fetches poster history for a specific user
 * TODO: Replace with apiFetch(`${API_BASE_URL}/users/${userId}/posters`) when backend is ready
 * @see {@link apiFetch} for error handling
 * Note: Backend will handle validation - mock assumes valid userId from hook guard
 */
export async function fetchPosterHistory(userId: string): Promise<Poster[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_POSTERS[userId] ?? [];
}
