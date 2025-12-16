import { z } from 'zod';

// ===========================================
// Belt Ranks
// ===========================================

export const BeltRank = {
  WHITE: 'white',
  BLUE: 'blue',
  PURPLE: 'purple',
  BROWN: 'brown',
  BLACK: 'black',
} as const;

export type BeltRank = (typeof BeltRank)[keyof typeof BeltRank];

export const BeltRankSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black']);

// ===========================================
// Subscription Tiers
// ===========================================

export const SubscriptionTier = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const SubscriptionTierSchema = z.enum(['free', 'pro']);

// ===========================================
// Poster Status
// ===========================================

export const PosterStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type PosterStatus = (typeof PosterStatus)[keyof typeof PosterStatus];

export const PosterStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);

// ===========================================
// User
// ===========================================

export const UserSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  subscriptionTier: SubscriptionTierSchema,
  stripeCustomerId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// ===========================================
// Poster
// ===========================================

export const PosterSchema = z.object({
  posterId: z.string().uuid(),
  userId: z.string(),
  templateId: z.string(),
  status: PosterStatusSchema,
  athleteName: z.string().min(1),
  teamName: z.string().optional(),
  beltRank: BeltRankSchema,
  tournamentName: z.string().min(1),
  tournamentDate: z.string(),
  tournamentLocation: z.string().min(1),
  uploadedImageKey: z.string(),
  generatedImageKey: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Poster = z.infer<typeof PosterSchema>;

// ===========================================
// Template
// ===========================================

export const TemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  thumbnailUrl: z.string().url(),
  isPremium: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Template = z.infer<typeof TemplateSchema>;

// ===========================================
// API Request/Response Types
// ===========================================

export const CreatePosterInputSchema = z.object({
  templateId: z.string().min(1),
  athleteName: z.string().min(1).max(100),
  teamName: z.string().max(100).optional(),
  beltRank: BeltRankSchema,
  tournamentName: z.string().min(1).max(200),
  tournamentDate: z.string(),
  tournamentLocation: z.string().min(1).max(200),
  uploadedImageKey: z.string().min(1),
});

export type CreatePosterInput = z.infer<typeof CreatePosterInputSchema>;

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}
