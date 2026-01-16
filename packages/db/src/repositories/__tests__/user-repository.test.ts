import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../user-repository.js';

const mockSend = vi.fn();
const mockClient = { send: mockSend } as any;

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new UserRepository(mockClient);
  });

  describe('checkAndIncrementUsage', () => {
    it('allows usage when under limit', async () => {
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 1,
            usageResetAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({});

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('denies usage when at limit', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'USER#user-123',
          SK: 'PROFILE',
          userId: 'user-123',
          email: 'test@example.com',
          subscriptionTier: 'free',
          postersThisMonth: 2,
          usageResetAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('resets usage when past reset date', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'free',
            postersThisMonth: 2,
            usageResetAt: pastDate,
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
      mockSend
        .mockResolvedValueOnce({
          Item: {
            PK: 'USER#user-123',
            SK: 'PROFILE',
            userId: 'user-123',
            email: 'test@example.com',
            subscriptionTier: 'premium',
            postersThisMonth: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({});

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it('creates new user record when user does not exist', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({});

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
            usageResetAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })
        .mockResolvedValueOnce({});

      const result = await repo.checkAndIncrementUsage('user-123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(20);
      expect(result.limit).toBe(20);
      expect(result.remaining).toBe(0);
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
          usageResetAt: new Date(Date.now() + 86400000).toISOString(),
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
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'USER#user-123',
          SK: 'PROFILE',
          userId: 'user-123',
          email: 'test@example.com',
          subscriptionTier: 'free',
          postersThisMonth: 2,
          usageResetAt: pastDate,
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
