/**
 * Generate Poster Handler Types
 */

import { z } from 'zod';

export const beltRankSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black']);

/**
 * Belt rank type inferred from Zod schema.
 * This is structurally identical to BeltRank from @bjj-poster/db but derived
 * from the validation schema for type safety - ensures validated input is
 * correctly typed without casting.
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
