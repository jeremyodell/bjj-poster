/**
 * Generate Poster Handler Types
 */

import { z } from 'zod';

export const beltRankSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black']);

export const generatePosterSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  athleteName: z.string().min(1, 'Athlete name is required').max(100),
  teamName: z.string().max(100).optional(),
  beltRank: beltRankSchema,
  tournamentName: z.string().min(1, 'Tournament name is required').max(200),
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
