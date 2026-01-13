import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES } from '../error-messages';

describe('ERROR_MESSAGES', () => {
  it('has all required photo upload error messages', () => {
    expect(ERROR_MESSAGES.PHOTO_TOO_LARGE).toBeDefined();
    expect(ERROR_MESSAGES.PHOTO_TOO_LARGE.title).toBe('Photo is too large');
    expect(ERROR_MESSAGES.PHOTO_INVALID_FORMAT).toBeDefined();
    expect(ERROR_MESSAGES.PHOTO_UPLOAD_FAILED).toBeDefined();
  });

  it('has all required generation error messages', () => {
    expect(ERROR_MESSAGES.GENERATION_TIMEOUT).toBeDefined();
    expect(ERROR_MESSAGES.GENERATION_API_FAILURE).toBeDefined();
    expect(ERROR_MESSAGES.QUOTA_EXCEEDED).toBeDefined();
  });

  it('has all required network error messages', () => {
    expect(ERROR_MESSAGES.OFFLINE).toBeDefined();
    expect(ERROR_MESSAGES.API_UNREACHABLE).toBeDefined();
  });

  it('each message has required properties', () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('description');
      expect(message).toHaveProperty('emoji');
      expect(typeof message.title).toBe('string');
      expect(typeof message.description).toBe('string');
      expect(typeof message.emoji).toBe('string');
    });
  });
});
