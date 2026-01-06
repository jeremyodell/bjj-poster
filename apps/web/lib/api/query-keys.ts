/**
 * Sentinel value for disabled queries - using unique string to avoid Symbol serialization issues
 * String is JSON-serializable and works with DevTools/persistence
 */
const DISABLED_USER = '__DISABLED__' as const;

/**
 * Query key factory for consistent cache key management
 * Prevents typos and ensures type-safe query invalidation
 */
export const queryKeys = {
  templates: {
    all: ['templates'] as const,
  },
  posters: {
    all: ['posters'] as const,
    /**
     * Query key for user-specific poster history
     * Uses '__DISABLED__' sentinel when userId is undefined to prevent collision
     */
    byUser: (userId: string | undefined) =>
      userId
        ? ([...queryKeys.posters.all, userId] as const)
        : ([...queryKeys.posters.all, DISABLED_USER] as const),
  },
} as const;
