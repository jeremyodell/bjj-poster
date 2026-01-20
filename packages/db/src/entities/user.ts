/**
 * User Entity Types
 *
 * Represents user profile and subscription data in DynamoDB.
 * Key pattern: PK=USER#<userId>, SK=PROFILE
 */

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  userId: string;
  email: string;
  name?: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  postersThisMonth?: number;
  usageResetAt?: string;
  lastActiveAt?: string;
}

/**
 * DynamoDB item structure for User
 */
export interface UserItem {
  PK: string; // USER#<userId>
  SK: string; // PROFILE
  entityType: 'USER';
  userId: string;
  email: string;
  name?: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  postersThisMonth?: number;
  usageResetAt?: string;
  lastActiveAt?: string;
}

export interface UpdateSubscriptionInput {
  tier: SubscriptionTier;
  stripeSubscriptionId: string | null;
  stripeCustomerId?: string;
}
