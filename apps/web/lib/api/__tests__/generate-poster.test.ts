import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePoster, GeneratePosterRequest } from '../generate-poster';

describe('generatePoster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validRequest: GeneratePosterRequest = {
    athletePhoto: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
    athleteName: 'John Doe',
    beltRank: 'purple',
    tournament: 'IBJJF Worlds',
    templateId: 'template-123',
  };

  it('returns a poster response with id and imageUrl', async () => {
    const promise = generatePoster(validRequest);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.posterId).toBeDefined();
    expect(result.imageUrl).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it('calls progress callback with increasing values', async () => {
    const onProgress = vi.fn();
    const promise = generatePoster(validRequest, onProgress);

    await vi.runAllTimersAsync();
    await promise;

    expect(onProgress).toHaveBeenCalled();
    const calls = onProgress.mock.calls.map((c) => c[0]);
    // Progress should increase
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i]).toBeGreaterThanOrEqual(calls[i - 1]);
    }
    // Should reach 100
    expect(calls[calls.length - 1]).toBe(100);
  });

  it('includes optional fields in request', async () => {
    const requestWithOptionals: GeneratePosterRequest = {
      ...validRequest,
      team: 'Gracie Barra',
      date: '2026-03-15',
      location: 'Irvine, CA',
    };

    const promise = generatePoster(requestWithOptionals);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.posterId).toBeDefined();
  });
});
