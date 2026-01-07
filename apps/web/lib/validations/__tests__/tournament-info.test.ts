import { describe, it, expect } from 'vitest';
import {
  tournamentInfoSchema,
  MAX_TOURNAMENT_LENGTH,
  MAX_LOCATION_LENGTH,
} from '../tournament-info';

describe('tournamentInfoSchema', () => {
  describe('tournament field', () => {
    it('validates required tournament name', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe('Tournament name is required');
      }
    });

    it('trims whitespace and validates', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('   ');
      expect(result.success).toBe(false);
    });

    it('accepts valid tournament name', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('IBJJF Worlds 2026');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('IBJJF Worlds 2026');
      }
    });

    it('rejects tournament name exceeding max length', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'Tournament name must be 100 characters or less'
        );
      }
    });

    it('exports MAX_TOURNAMENT_LENGTH as 100', () => {
      expect(MAX_TOURNAMENT_LENGTH).toBe(100);
    });
  });

  describe('date field', () => {
    it('accepts empty date (optional)', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('');
      expect(result.success).toBe(true);
    });

    it('accepts valid ISO date format', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('2026-03-15');
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('March 15, 2026');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe('Invalid date format');
      }
    });
  });

  describe('location field', () => {
    it('accepts empty location (optional)', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('');
      expect(result.success).toBe(true);
    });

    it('trims whitespace', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('  Las Vegas, NV  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Las Vegas, NV');
      }
    });

    it('rejects location exceeding max length', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'Location must be 100 characters or less'
        );
      }
    });

    it('exports MAX_LOCATION_LENGTH as 100', () => {
      expect(MAX_LOCATION_LENGTH).toBe(100);
    });
  });
});
