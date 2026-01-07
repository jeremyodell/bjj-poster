import { z } from 'zod';

export const athleteInfoSchema = z.object({
  athleteName: z
    .string()
    .trim()
    .min(1, 'Athlete name is required')
    .max(50, 'Name must be 50 characters or less'),
  beltRank: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red']),
  team: z
    .string()
    .max(50, 'Team must be 50 characters or less')
    .optional()
    .or(z.literal('')),
});

export type AthleteInfoFormData = z.infer<typeof athleteInfoSchema>;
