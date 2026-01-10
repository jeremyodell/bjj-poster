import { z } from 'zod';

export const createCheckoutSchema = z.object({
  tier: z.enum(['pro', 'premium']),
  interval: z.enum(['month', 'year']),
});

export type CreateCheckoutRequest = z.infer<typeof createCheckoutSchema>;

export interface CreateCheckoutResponse {
  url: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';
