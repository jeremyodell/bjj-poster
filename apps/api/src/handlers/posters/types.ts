/**
 * Generate Poster Handler Types
 */

import { z } from 'zod';

export const beltRankSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black']);

/**
 * Belt rank type inferred from Zod schema.
 *
 * TYPE RELATIONSHIP WITH @bjj-poster/db:
 * This type is structurally identical to BeltRank from @bjj-poster/db
 * ('white' | 'blue' | 'purple' | 'brown' | 'black'). We define it separately
 * here for these reasons:
 * 1. The Zod schema is the source of truth for API validation
 * 2. TypeScript's structural typing ensures assignment compatibility
 * 3. Avoids circular dependency between API and DB packages
 *
 * If either type changes, TypeScript will catch the incompatibility at compile
 * time when we assign validated input to DB functions (generate-poster.ts:294).
 */
export type BeltRankInput = z.infer<typeof beltRankSchema>;

export const generatePosterSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  athleteName: z.string().min(1, 'Athlete name is required').max(100),
  teamName: z.string().max(100).optional(),
  beltRank: beltRankSchema,
  tournamentName: z.string().min(1, 'Tournament name is required').max(200),
  // tournamentDate is intentionally a free-form string (not ISO-8601) to support
  // flexible display formats like "June 2025", "Summer 2024", "March 15-17, 2025".
  // This is a display-only field rendered directly on the poster, not used for
  // date calculations or sorting.
  tournamentDate: z.string().min(1, 'Tournament date is required').max(50),
  tournamentLocation: z.string().max(200).optional(),
  achievement: z.string().max(200).optional(),
});

export type GeneratePosterInput = z.infer<typeof generatePosterSchema>;

export interface GeneratePosterResponse {
  poster: {
    id: string;
    templateId: string;
    athleteName: string;
    teamName?: string;
    beltRank: string;
    tournamentName: string;
    tournamentDate: string;
    tournamentLocation?: string;
    achievement?: string;
    status: string;
    imageUrl: string;
    thumbnailUrl: string;
    createdAt: string;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
  };
}

export interface QuotaExceededResponse {
  message: string;
  code: 'QUOTA_EXCEEDED';
  usage: {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
  };
}

/**
 * Poster item in list response
 */
export interface PosterListItem {
  id: string;
  templateId: string;
  athleteName: string;
  teamName?: string;
  beltRank: string;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation?: string;
  achievement?: string;
  status: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

/**
 * GET /api/posters response
 */
export interface GetUserPostersResponse {
  posters: PosterListItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  count: number;
}

/**
 * Valid belt ranks for filtering
 */
export const VALID_BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'] as const;
export type BeltRankFilter = (typeof VALID_BELT_RANKS)[number];

export function isValidBeltRank(value: string): value is BeltRankFilter {
  return VALID_BELT_RANKS.includes(value as BeltRankFilter);
}
