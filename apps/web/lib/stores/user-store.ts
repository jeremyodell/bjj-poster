import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserState {
  user: User | null;
  subscriptionTier: SubscriptionTier;
  postersThisMonth: number;
  postersLimit: number;
}

export interface UserActions {
  /**
   * Sets the current user and their subscription tier.
   * - If user ID changes (different user or login), resets postersThisMonth to 0
   * - If same user changes tier (upgrade/downgrade), preserves postersThisMonth
   */
  setUser: (user: User | null, tier?: SubscriptionTier) => void;
  /**
   * Clears user session and resets all state to defaults.
   * Call this on logout.
   */
  resetUser: () => void;
  /**
   * Returns true if user can create another poster based on subscription quota.
   * NOTE: This is for UI feedback only. Server-side validation in the API
   * is the authoritative source for quota enforcement.
   */
  canCreatePoster: () => boolean;
  /**
   * Increments the monthly poster usage count.
   *
   * IMPORTANT:
   * - Caller should check canCreatePoster() first for UI feedback
   * - This is not atomic; rapid calls could cause race conditions
   * - Server is the authoritative source of truth for usage counts
   * - Server-side validation MUST enforce limits independently
   */
  incrementUsage: () => void;
}

export type UserStore = UserState & UserActions;

/** Represents unlimited quota (-1 used for comparison) */
export const UNLIMITED = -1;

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 2,
  pro: 20,
  premium: UNLIMITED,
};

const initialState: UserState = {
  user: null,
  subscriptionTier: 'free',
  postersThisMonth: 0,
  postersLimit: TIER_LIMITS.free,
};

/**
 * User session and subscription quota store.
 *
 * PERSISTENCE NOTE: This store intentionally does NOT persist to localStorage.
 * User session state should be restored from the authentication provider on
 * page load (e.g., via NextAuth, Clerk, or custom auth). The postersThisMonth
 * count should be fetched from the server API, which is the authoritative
 * source for quota tracking.
 *
 * SECURITY NOTE: Client-side quota checks (canCreatePoster) are for UI feedback
 * only. The server API MUST independently validate quota limits. Never trust
 * client-reported usage counts.
 */
export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUser: (user, tier = 'free') => {
        const currentUser = get().user;
        const isNewUser = !currentUser || !user || currentUser.id !== user.id;

        set({
          user,
          subscriptionTier: tier,
          postersLimit: TIER_LIMITS[tier],
          // Only reset quota when user ID changes, not on tier change
          ...(isNewUser && { postersThisMonth: 0 }),
        });
      },

      resetUser: () => set(initialState),

      canCreatePoster: () => {
        const { postersLimit, postersThisMonth } = get();
        if (postersLimit === UNLIMITED) return true;
        return postersThisMonth < postersLimit;
      },

      incrementUsage: () =>
        set((state) => ({
          postersThisMonth: state.postersThisMonth + 1,
        })),
    }),
    { name: 'UserStore' }
  )
);
