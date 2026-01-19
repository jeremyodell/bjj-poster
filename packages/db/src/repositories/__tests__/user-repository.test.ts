import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UserRepository } from '../user-repository.js';

const mockSend = vi.fn();
// Create a minimal mock that satisfies the DynamoDBDocumentClient interface
// Only the 'send' method is used by the repository
const mockClient = { send: mockSend } as unknown as DynamoDBDocumentClient;

// Fixed test date: 2026-01-17T12:00:00.000Z
const TEST_NOW = new Date('2026-01-17T12:00:00.000Z').getTime();
const FUTURE_RESET_DATE = '2026-02-01T00:00:00.000Z'; // First of next month
const PAST_RESET_DATE = '2026-01-01T00:00:00.000Z'; // First of this month (in the past)

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    // Reset mock to clear the queue of resolved values
    mockSend.mockReset();
    // Reset timers to real before setting up fake timers
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(TEST_NOW);
    repo = new UserRepository(mockClient);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkAndIncrementUsage', () => {
    it('allows usage when under limit', async () => {
      // 1. getById returns user with postersThisMonth: 1
      // 2. atomicIncrementWithLimit UpdateCommand returns Attributes with new count
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 1,
            usageResetAt: FUTURE_RESET_DATE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({ Attributes: { postersThisMonth: 2 } });

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
      expect(result.resetsAt).toBe(FUTURE_RESET_DATE);
    });

    it('denies usage when at limit', async () => {
      // 1. getById returns user with postersThisMonth: 2 (at limit)
      // 2. atomicIncrementWithLimit throws ConditionalCheckFailedException
      // Implementation uses already-fetched user data (no redundant getUsage call)
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 2,
            usageResetAt: FUTURE_RESET_DATE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockRejectedValueOnce(
          new ConditionalCheckFailedException({ message: 'Limit exceeded', $metadata: {} })
        );

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(2);
      expect(result.remaining).toBe(0);
      expect(result.resetsAt).toBe(FUTURE_RESET_DATE);
      // Verify no redundant getUsage call - only 2 DB calls (getById + atomic update)
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('resets usage when past reset date', async () => {
      // 1. getById returns user with past usageResetAt
      // 2. atomicIncrementWithLimit resets and sets to 1
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 2,
            usageResetAt: PAST_RESET_DATE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({});

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
    });

    it('allows unlimited for premium tier', async () => {
      // Premium uses atomicIncrementUsage (not WithLimit)
      // 1. getById returns premium user
      // 2. atomicIncrementUsage UpdateCommand with ReturnValues
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'premium',
            postersThisMonth: 100,
            usageResetAt: FUTURE_RESET_DATE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({ Attributes: { postersThisMonth: 101 } });

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.resetsAt).toBe(FUTURE_RESET_DATE);
    });

    it('creates new user record when user does not exist', async () => {
      // 1. getById returns null
      // 2. atomicIncrementWithLimit UpdateCommand succeeds
      mockSend
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({ Attributes: { postersThisMonth: 1 } });

      const result = await repo.checkAndIncrementUsage('new-user');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(1);
    });

    it('applies pro tier limit of 20', async () => {
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'pro',
            postersThisMonth: 19,
            usageResetAt: FUTURE_RESET_DATE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({ Attributes: { postersThisMonth: 20 } });

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(20);
      expect(result.limit).toBe(20);
      expect(result.remaining).toBe(0);
      expect(result.resetsAt).toBe(FUTURE_RESET_DATE);
    });
  });

  describe('getUsage', () => {
    it('returns usage stats without incrementing', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'USER#user-123',
          SK: 'PROFILE',
          userId: 'user-123',
          email: 'test@example.com',
          subscriptionTier: 'free',
          postersThisMonth: 1,
          usageResetAt: FUTURE_RESET_DATE,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      const result = await repo.getUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(1);
      // Should only call getById, not update
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('returns zero usage for non-existent user', async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await repo.getUsage('new-user');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(0);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(2);
    });

    it('resets usage count when past reset date', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'USER#user-123',
          SK: 'PROFILE',
          userId: 'user-123',
          email: 'test@example.com',
          subscriptionTier: 'free',
          postersThisMonth: 2,
          usageResetAt: PAST_RESET_DATE,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      const result = await repo.getUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(0);
      expect(result.remaining).toBe(2);
    });
  });
});
