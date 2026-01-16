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
        userId: 'user-123',
        templateId: 'classic',
        athleteName: 'João Silva',
        beltRank: 'blue',
        tournamentName: 'World Championship',
        tournamentDate: 'June 2025',
        imageKey: 'posters/user-123/pstr_abc/original.jpg',
        thumbnailKey: 'posters/user-123/pstr_abc/thumbnail.jpg',
        uploadKey: 'uploads/user-123/pstr_abc/photo.jpg',
      };

      const poster = await repo.create(input);

      expect(poster.userId).toBe('user-123');
      expect(poster.athleteName).toBe('João Silva');
      expect(poster.status).toBe('completed');
      expect(poster.posterId).toMatch(/^pstr_/);
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
});
