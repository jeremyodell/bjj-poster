/**
 * User Repository
 *
 * Handles all DynamoDB operations for users.
 * See .claude/skills/dynamodb-operations.md for patterns
 */

import { UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
   * Note: This uses a scan with filter, which works for small-medium tables
   * but should be replaced with a GSI query for larger scale.
   * TODO: Add StripeSubscriptionIndex GSI for O(1) lookups.
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
   * Check if user can create a poster and increment usage if allowed.
   */
  async checkAndIncrementUsage(userId: string): Promise<UsageCheckResult> {
    const user = await this.getById(userId);

    if (!user) {
      const resetsAt = this.getNextResetDate();
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :count, usageResetAt = :reset, updatedAt = :now',
          ExpressionAttributeValues: {
            ':count': 1,
            ':reset': resetsAt,
            ':now': new Date().toISOString(),
          },
        })
      );
      const limit = TIER_LIMITS.free;
      return { allowed: true, used: 1, limit, remaining: limit - 1, resetsAt };
    }

    const tier = user.subscriptionTier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const now = new Date();
    const resetsAt = user.usageResetAt || this.getNextResetDate();
    const needsReset = !user.usageResetAt || new Date(user.usageResetAt) <= now;
    const currentUsage = needsReset ? 0 : (user.postersThisMonth || 0);

    if (limit === -1) {
      await this.client.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postersThisMonth = :count, updatedAt = :now',
          ExpressionAttributeValues: {
            ':count': currentUsage + 1,
            ':now': now.toISOString(),
          },
        })
      );
      return { allowed: true, used: currentUsage + 1, limit: -1, remaining: -1, resetsAt: needsReset ? this.getNextResetDate() : resetsAt };
    }

    if (currentUsage >= limit) {
      return { allowed: false, used: currentUsage, limit, remaining: 0, resetsAt: needsReset ? this.getNextResetDate() : resetsAt };
    }

    const newUsage = currentUsage + 1;
    const newResetsAt = needsReset ? this.getNextResetDate() : resetsAt;

    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET postersThisMonth = :count, usageResetAt = :reset, updatedAt = :now',
        ExpressionAttributeValues: {
          ':count': newUsage,
          ':reset': newResetsAt,
          ':now': now.toISOString(),
        },
      })
    );

    return { allowed: true, used: newUsage, limit, remaining: limit - newUsage, resetsAt: newResetsAt };
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
