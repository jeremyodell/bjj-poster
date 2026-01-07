import { z } from 'zod';

/** Maximum length for athlete name field */
export const MAX_NAME_LENGTH = 50;

/** Maximum length for team field */
export const MAX_TEAM_LENGTH = 50;

/**
 * Sanitizes input by trimming whitespace.
 * Applied via transform to ensure stored values are clean.
 */
const sanitizeString = (val: string): string => val.trim();

export const athleteInfoSchema = z.object({
  athleteName: z
    .string()
    .trim()
    .min(1, 'Athlete name is required')
    .max(MAX_NAME_LENGTH, 'Name must be 50 characters or less')
    .transform(sanitizeString),
  beltRank: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red']),
  /** Team is optional - empty string is valid */
  team: z
    .string()
    .max(MAX_TEAM_LENGTH, 'Team must be 50 characters or less')
    .transform(sanitizeString),
});

export type AthleteInfoFormData = z.infer<typeof athleteInfoSchema>;
