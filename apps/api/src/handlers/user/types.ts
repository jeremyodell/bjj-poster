/**
 * Get Profile Response Types
 *
 * GET /api/user/profile
 */

import type { SubscriptionTier } from '@bjj-poster/db';

export interface UserProfileData {
  id: string;
  email: string;
  name?: string;
}

export interface SubscriptionData {
  tier: SubscriptionTier;
}

export interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export interface GetProfileResponse {
  user: UserProfileData;
  subscription: SubscriptionData;
  quota: QuotaData;
}
