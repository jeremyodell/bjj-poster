import { z } from 'zod';

/** Maximum length for tournament name field */
export const MAX_TOURNAMENT_LENGTH = 100;

/** Maximum length for location field */
export const MAX_LOCATION_LENGTH = 100;

/**
 * Tournament info validation schema.
 * Uses .trim() which both validates against trimmed values AND returns trimmed output.
 */
export const tournamentInfoSchema = z.object({
  tournament: z
    .string()
    .trim()
    .min(1, 'Tournament name is required')
    .max(MAX_TOURNAMENT_LENGTH, 'Tournament name must be 100 characters or less'),
  date: z
    .string()
    .refine(
      (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Invalid date format'
    ),
  location: z
    .string()
    .trim()
    .max(MAX_LOCATION_LENGTH, 'Location must be 100 characters or less'),
});

export type TournamentInfoFormData = z.infer<typeof tournamentInfoSchema>;
