import { describe, it, expect } from 'vitest';
import { createCheckoutSchema, type CreateCheckoutRequest } from '../types.js';

describe('createCheckoutSchema', () => {
  it('accepts valid pro monthly request', () => {
    const input = { tier: 'pro', interval: 'month' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts valid premium annual request', () => {
    const input = { tier: 'premium', interval: 'year' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects invalid tier', () => {
    const input = { tier: 'enterprise', interval: 'month' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid interval', () => {
    const input = { tier: 'pro', interval: 'weekly' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const input = { tier: 'pro' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
