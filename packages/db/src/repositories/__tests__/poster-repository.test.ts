import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterRepository } from '../poster-repository.js';
import type { CreatePosterInput } from '../../entities/poster.js';

// Mock DynamoDB client
const mockSend = vi.fn();
const mockClient = { send: mockSend } as any;

describe('PosterRepository', () => {
  let repo: PosterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PosterRepository(mockClient);
  });

  describe('create', () => {
    it('creates a poster with correct keys', async () => {
      mockSend.mockResolvedValueOnce({});

      const input: CreatePosterInput = {
        posterId: 'pstr_test123abc',
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'World Championship',
        tournamentDate: 'June 2025',
        imageKey: 'posters/user-123/pstr_test123abc/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_test123abc/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_test123abc/photo.jpg',
      };

      const poster = await repo.create(input);

      expect(poster.userId).toBe('user-123');
      expect(poster.athleteName).toBe('João Silva');
      expect(poster.status).toBe('completed');
      expect(poster.posterId).toBe('pstr_test123abc');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getByUserId', () => {
    it('returns posters for a user', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'USER#user-123',
            SK: 'POSTER#2026-01-16T00:00:00.000Z#pstr_abc',
            posterId: 'pstr_abc',
            userId: 'user-123',
            templateId: 'classic',
            athleteName: 'João Silva',
            beltRank: 'blue',
            tournamentName: 'World Championship',
            tournamentDate: 'June 2025',
            status: 'completed',
            imageKey: 'posters/user-123/pstr_abc/original.jpg',
            thumbnailKey: 'posters/user-123/pstr_abc/thumbnail.jpg',
            uploadKey: 'uploads/user-123/pstr_abc/photo.jpg',
            createdAt: '2026-01-16T00:00:00.000Z',
            updatedAt: '2026-01-16T00:00:00.000Z',
          },
        ],
      });

      const posters = await repo.getByUserId('user-123');

      expect(posters).toHaveLength(1);
      expect(posters[0].posterId).toBe('pstr_abc');
    });
  });

  describe('countForCurrentMonth', () => {
    it('returns count of posters for current month', async () => {
      mockSend.mockResolvedValueOnce({
        Count: 3,
      });

      const count = await repo.countForCurrentMonth('user-123');

      expect(count).toBe(3);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('returns 0 when no posters exist', async () => {
      mockSend.mockResolvedValueOnce({
        Count: 0,
      });

      const count = await repo.countForCurrentMonth('user-123');

      expect(count).toBe(0);
    });
  });

  describe('getByUserIdPaginated', () => {
    it('returns paginated posters with nextCursor when more items exist', async () => {
      const items = [
        {
          PK: 'USER#user-123',
          SK: 'POSTER#2026-01-18T12:00:00.000Z#pstr_1',
          posterId: 'pstr_1',
          userId: 'user-123',
          templateId: 'classic',
          athleteName: 'João Silva',
          beltRank: 'blue',
          tournamentName: 'Worlds',
          tournamentDate: 'June 2026',
          status: 'completed',
          imageKey: 'posters/user-123/pstr_1/original.jpg',
          thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
          uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
          createdAt: '2026-01-18T12:00:00.000Z',
          updatedAt: '2026-01-18T12:00:00.000Z',
        },
        {
          PK: 'USER#user-123',
          SK: 'POSTER#2026-01-17T12:00:00.000Z#pstr_2',
          posterId: 'pstr_2',
          userId: 'user-123',
          templateId: 'modern',
          athleteName: 'João Silva',
          beltRank: 'purple',
          tournamentName: 'Pans',
          tournamentDate: 'March 2026',
          status: 'completed',
          imageKey: 'posters/user-123/pstr_2/original.jpg',
          thumbnailKey: 'posters/user-123/pstr_2/thumbnail.jpg',
          uploadKey: 'uploads/user-123/pstr_2/photo.jpg',
          createdAt: '2026-01-17T12:00:00.000Z',
          updatedAt: '2026-01-17T12:00:00.000Z',
        },
        {
          PK: 'USER#user-123',
          SK: 'POSTER#2026-01-16T12:00:00.000Z#pstr_3',
          posterId: 'pstr_3',
          userId: 'user-123',
          templateId: 'classic',
          athleteName: 'João Silva',
          beltRank: 'blue',
          tournamentName: 'Europeans',
          tournamentDate: 'January 2026',
          status: 'completed',
          imageKey: 'posters/user-123/pstr_3/original.jpg',
          thumbnailKey: 'posters/user-123/pstr_3/thumbnail.jpg',
          uploadKey: 'uploads/user-123/pstr_3/photo.jpg',
          createdAt: '2026-01-16T12:00:00.000Z',
          updatedAt: '2026-01-16T12:00:00.000Z',
        },
      ];

      // Return limit+1 items to indicate more exist
      mockSend.mockResolvedValueOnce({ Items: items });

      const result = await repo.getByUserIdPaginated('user-123', { limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).not.toBeNull();
      expect(result.items[0].posterId).toBe('pstr_1');
      expect(result.items[1].posterId).toBe('pstr_2');
    });

    it('returns null nextCursor when no more items', async () => {
      const items = [
        {
          PK: 'USER#user-123',
          SK: 'POSTER#2026-01-18T12:00:00.000Z#pstr_1',
          posterId: 'pstr_1',
          userId: 'user-123',
          templateId: 'classic',
          athleteName: 'João Silva',
          beltRank: 'blue',
          tournamentName: 'Worlds',
          tournamentDate: 'June 2026',
          status: 'completed',
          imageKey: 'posters/user-123/pstr_1/original.jpg',
          thumbnailKey: 'posters/user-123/pstr_1/thumbnail.jpg',
          uploadKey: 'uploads/user-123/pstr_1/photo.jpg',
          createdAt: '2026-01-18T12:00:00.000Z',
          updatedAt: '2026-01-18T12:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: items });

      const result = await repo.getByUserIdPaginated('user-123', { limit: 2 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('uses default limit of 20', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await repo.getByUserIdPaginated('user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Limit: 21, // limit + 1
          }),
        })
      );
    });

    it('decodes cursor and sets ExclusiveStartKey', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const cursor = Buffer.from('POSTER#2026-01-17T12:00:00.000Z#pstr_2').toString('base64');
      await repo.getByUserIdPaginated('user-123', { cursor });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            ExclusiveStartKey: {
              PK: 'USER#user-123',
              SK: 'POSTER#2026-01-17T12:00:00.000Z#pstr_2',
            },
          }),
        })
      );
    });

    it('filters by beltRank when provided', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await repo.getByUserIdPaginated('user-123', { beltRank: 'purple' });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            FilterExpression: 'beltRank = :beltRank',
            ExpressionAttributeValues: expect.objectContaining({
              ':beltRank': 'purple',
            }),
          }),
        })
      );
    });

    it('returns empty result when no posters exist', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await repo.getByUserIdPaginated('user-123');

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });
});
