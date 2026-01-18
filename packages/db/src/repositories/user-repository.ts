/**
 * User Repository
 *
 * Handles all DynamoDB operations for users.
 * See .claude/skills/dynamodb-operations.md for patterns
 */

import { UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME } from '../config.js';
import type {
  User,
  UserItem,
  UpdateSubscriptionInput,
} from '../entities/user.js';

const TIER_LIMITS: Record<string, number> = {
  free: 2,
  pro: 20,
  premium: -1, // Unlimited
};

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export class UserRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Get a user by ID
   */
  async getById(userId: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.toEntity(result.Item as UserItem);
  }

  /**
   * Get a user by their Stripe subscription ID.
   *
   * SCALE LIMITATIONS:
   * This uses a scan with filter, which is O(n) where n is the total number
   * of user records. Current acceptable limits:
   * - Acceptable for < 10,000 users (scan takes < 1s, costs ~$0.00025 per call)
   * - At 100,000 users: consider adding StripeSubscriptionIndex GSI
   * - Stripe webhooks are infrequent (subscription events), so scan cost is low
   *
   * TODO(ODE-XXX): Add StripeSubscriptionIndex GSI when user count exceeds 10K.
   * GSI would have: PK=stripeSubscriptionId, projections=[userId, email, tier]
   *
   * @param stripeSubscriptionId - The Stripe subscription ID
   * @returns The user if found, null otherwise
   */
  async getByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<User | null> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          'SK = :sk AND stripeSubscriptionId = :subId',
        ExpressionAttributeValues: {
          ':sk': 'PROFILE',
          ':subId': stripeSubscriptionId,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.toEntity(result.Items[0] as UserItem);
  }

  /**
   * Update user subscription after successful Stripe checkout.
   *
   * This is an upsert-style operation that updates the subscription fields
   * on an existing user record. The operation is idempotent - calling it
   * multiple times with the same input will produce the same result.
   *
   * @param userId - The Cognito user ID (sub claim)
   * @param input - Subscription details including tier, Stripe IDs.
   *                Pass null for stripeSubscriptionId to clear it (on cancellation).
   * @throws Error if DynamoDB update fails
   *
   * @example
   * ```typescript
   * // Upgrade to pro
   * await db.users.updateSubscription('user-123', {
   *   tier: 'pro',
   *   stripeSubscriptionId: 'sub_xxx',
   *   stripeCustomerId: 'cus_xxx',
   * });
   *
   * // Downgrade to free (subscription cancelled)
   * await db.users.updateSubscription('user-123', {
   *   tier: 'free',
   *   stripeSubscriptionId: null,
   * });
   * ```
   */
  async updateSubscription(
    userId: string,
    input: UpdateSubscriptionInput
  ): Promise<void> {
    const now = new Date().toISOString();

    const setExpressions = ['subscriptionTier = :tier', 'updatedAt = :updatedAt'];
    const removeExpressions: string[] = [];

    const expressionValues: Record<string, unknown> = {
      ':tier': input.tier,
      ':updatedAt': now,
    };

    // Handle stripeSubscriptionId: SET if value provided, REMOVE if null
    if (input.stripeSubscriptionId !== null) {
      setExpressions.push('stripeSubscriptionId = :subId');
      expressionValues[':subId'] = input.stripeSubscriptionId;
    } else {
      removeExpressions.push('stripeSubscriptionId');
    }

    if (input.stripeCustomerId) {
      setExpressions.push('stripeCustomerId = :custId');
      expressionValues[':custId'] = input.stripeCustomerId;
    }

    // Build UpdateExpression: SET ... REMOVE ...
    let updateExpression = `SET ${setExpressions.join(', ')}`;
    if (removeExpressions.length > 0) {
      updateExpression += ` REMOVE ${removeExpressions.join(', ')}`;
    }

    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues,
      })
    );
  }

  /**
   * Atomically check if user can create a poster and increment usage if allowed.
   *
   * Uses DynamoDB conditional expressions to prevent race conditions where
   * concurrent requests could bypass quota limits.
   *
   * IMPORTANT: To prevent TOCTOU race conditions (where tier could change between
   * reading the user and the atomic operation), the conditional expression also
   * validates that the tier hasn't changed. If the tier changed to a more
   * restrictive tier, the operation will fail with ConditionalCheckFailedException.
   */
  async checkAndIncrementUsage(userId: string): Promise<UsageCheckResult> {
    const user = await this.getById(userId);
    const now = new Date();
    const tier = user?.subscriptionTier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const newResetsAt = this.getNextResetDate();
    const existingResetsAt = user?.usageResetAt || newResetsAt;

    // Check if usage needs reset (new month)
    const needsReset = !user?.usageResetAt || new Date(user.usageResetAt) <= now;

    // For unlimited tier, just increment without condition
    if (limit === -1) {
      const result = await this.atomicIncrementUsage(userId, tier, needsReset, newResetsAt, existingResetsAt);
      return {
        allowed: true,
        used: result.newCount,
        limit: -1,
        remaining: -1,
        resetsAt: result.resetsAt,
      };
    }

    // For limited tiers, use conditional expression to enforce quota atomically
    // Also validates tier hasn't changed to prevent TOCTOU race conditions
    try {
      const result = await this.atomicIncrementWithLimit(userId, tier, limit, needsReset, newResetsAt, existingResetsAt);
      return {
        allowed: true,
        used: result.newCount,
        limit,
        remaining: limit - result.newCount,
        resetsAt: result.resetsAt,
      };
    } catch (error) {
      // ConditionalCheckFailedException means quota exceeded OR tier changed
      if (error instanceof ConditionalCheckFailedException) {
        // Use already-fetched user data instead of redundant getUsage() call
        const currentUsage = needsReset ? 0 : (user?.postersThisMonth || 0);
        return {
          allowed: false,
          used: currentUsage,
          limit,
          remaining: 0,
          resetsAt: existingResetsAt,
        };
      }
      throw error;
    }
  }

  /**
   * Atomically increment usage counter for unlimited tier users.
   *
   * Includes tier validation in conditional expression to prevent TOCTOU race
   * conditions where a user could be downgraded between the tier check and increment.
   */
  private async atomicIncrementUsage(
    userId: string,
    expectedTier: string,
    needsReset: boolean,
    newResetsAt: string,
    existingResetsAt: string
  ): Promise<{ newCount: number; resetsAt: string }> {
    const now = new Date().toISOString();

    // Condition to validate tier hasn't changed (premium -> free would be a problem)
    // For new users, subscriptionTier won't exist so we check for that too
    const tierCondition = 'subscriptionTier = :expectedTier';

    if (needsReset) {
      // Reset counter to 1 for new period
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :one, usageResetAt = :reset, updatedAt = :now',
          ConditionExpression: tierCondition,
          ExpressionAttributeValues: {
            ':one': 1,
            ':reset': newResetsAt,
            ':now': now,
            ':expectedTier': expectedTier,
          },
        })
      );
      return { newCount: 1, resetsAt: newResetsAt };
    }

    // Atomic increment using ADD with tier validation
    const result = await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET postersThisMonth = if_not_exists(postersThisMonth, :zero) + :one, updatedAt = :now',
        ConditionExpression: tierCondition,
        ExpressionAttributeValues: {
          ':one': 1,
          ':zero': 0,
          ':now': now,
          ':expectedTier': expectedTier,
        },
        ReturnValues: 'UPDATED_NEW',
      })
    );

    const newCount = (result.Attributes?.postersThisMonth as number) || 1;
    // Use existing resetsAt from the user we already fetched (no extra DB call)
    return { newCount, resetsAt: existingResetsAt };
  }

  /**
   * Atomically increment usage with limit check using conditional expression.
   * Throws ConditionalCheckFailedException if limit would be exceeded OR if tier changed.
   *
   * The tier validation prevents TOCTOU race conditions where a user could be
   * upgraded/downgraded between the initial tier check and this atomic operation.
   */
  private async atomicIncrementWithLimit(
    userId: string,
    expectedTier: string,
    limit: number,
    needsReset: boolean,
    newResetsAt: string,
    existingResetsAt: string
  ): Promise<{ newCount: number; resetsAt: string }> {
    const now = new Date().toISOString();

    // Tier validation: for new users (no tier set), they default to 'free'
    // We check both: tier matches expected OR tier doesn't exist and expected is 'free'
    const tierCondition = expectedTier === 'free'
      ? '(attribute_not_exists(subscriptionTier) OR subscriptionTier = :expectedTier)'
      : 'subscriptionTier = :expectedTier';

    if (needsReset) {
      // Reset counter to 1 for new period (always allowed since limit >= 1)
      // Include tier validation to prevent TOCTOU
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :one, usageResetAt = :reset, updatedAt = :now',
          ConditionExpression: tierCondition,
          ExpressionAttributeValues: {
            ':one': 1,
            ':reset': newResetsAt,
            ':now': now,
            ':expectedTier': expectedTier,
          },
        })
      );
      return { newCount: 1, resetsAt: newResetsAt };
    }

    // Atomic increment with conditions:
    // 1. Current count < limit (quota check)
    // 2. Tier hasn't changed (TOCTOU prevention)
    // Using SET with if_not_exists ensures atomicity even for new users
    const result = await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET postersThisMonth = if_not_exists(postersThisMonth, :zero) + :one, updatedAt = :now',
        ConditionExpression: `(attribute_not_exists(postersThisMonth) OR postersThisMonth < :limit) AND ${tierCondition}`,
        ExpressionAttributeValues: {
          ':one': 1,
          ':zero': 0,
          ':limit': limit,
          ':now': now,
          ':expectedTier': expectedTier,
        },
        ReturnValues: 'UPDATED_NEW',
      })
    );

    const newCount = (result.Attributes?.postersThisMonth as number) || 1;
    // Use existing resetsAt from the user we already fetched (no extra DB call)
    return { newCount, resetsAt: existingResetsAt };
  }

  /**
   * Decrement usage count (for rollback on failed operations)
   */
  async decrementUsage(userId: string): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET postersThisMonth = postersThisMonth - :one, updatedAt = :now',
        ConditionExpression: 'postersThisMonth > :zero',
        ExpressionAttributeValues: {
          ':one': 1,
          ':zero': 0,
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Get usage stats without incrementing
   */
  async getUsage(userId: string): Promise<UsageCheckResult> {
    const user = await this.getById(userId);
    const tier = user?.subscriptionTier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const now = new Date();
    const resetsAt = user?.usageResetAt || this.getNextResetDate();
    const needsReset = !user?.usageResetAt || new Date(user.usageResetAt) <= now;
    const currentUsage = needsReset ? 0 : (user?.postersThisMonth || 0);

    return {
      allowed: limit === -1 || currentUsage < limit,
      used: currentUsage,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
      resetsAt: needsReset ? this.getNextResetDate() : resetsAt,
    };
  }

  private getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  /**
   * Convert DynamoDB item to public entity
   */
  private toEntity(item: UserItem): User {
    return {
      userId: item.userId,
      email: item.email,
      name: item.name,
      subscriptionTier: item.subscriptionTier,
      stripeCustomerId: item.stripeCustomerId,
      stripeSubscriptionId: item.stripeSubscriptionId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      postersThisMonth: item.postersThisMonth,
      usageResetAt: item.usageResetAt,
    };
  }
}
