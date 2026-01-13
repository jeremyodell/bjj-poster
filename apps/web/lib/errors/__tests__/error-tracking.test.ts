import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackError } from '../error-tracking';

describe('trackError', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('logs error with type and timestamp', () => {
    trackError('photo_too_large');

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        type: 'photo_too_large',
        timestamp: expect.any(String),
      })
    );
  });

  it('includes context when provided', () => {
    trackError('photo_too_large', { fileSize: 15000000, maxSize: 10000000 });

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        type: 'photo_too_large',
        context: { fileSize: 15000000, maxSize: 10000000 },
      })
    );
  });

  it('includes url in browser environment', () => {
    trackError('generation_timeout');

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        url: expect.any(String),
      })
    );
  });

  it('accepts all valid error types', () => {
    const errorTypes = [
      'photo_too_large',
      'photo_invalid_format',
      'photo_upload_failed',
      'generation_timeout',
      'generation_api_failure',
      'quota_exceeded',
      'network_offline',
      'api_unreachable',
      'form_validation_error',
    ] as const;

    errorTypes.forEach((type) => {
      trackError(type);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
