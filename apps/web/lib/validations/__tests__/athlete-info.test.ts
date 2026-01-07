import { describe, it, expect } from 'vitest';
import { athleteInfoSchema } from '../athlete-info';

describe('athleteInfoSchema', () => {
  describe('athleteName', () => {
    it('requires athlete name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: '',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Athlete name is required');
      }
    });

    it('rejects names over 50 characters', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'A'.repeat(51),
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Name must be 50 characters or less');
      }
    });

    it('accepts valid name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John Doe',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(true);
    });

    it('trims whitespace before validation', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: '   ',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
    });

    it('transforms to trimmed value on output', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: '  John Doe  ',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.athleteName).toBe('John Doe');
      }
    });
  });

  describe('beltRank', () => {
    it('accepts all valid belt ranks', () => {
      const belts = ['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red'];

      belts.forEach((belt) => {
        const result = athleteInfoSchema.safeParse({
          athleteName: 'John',
          beltRank: belt,
          team: '',
        });

        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid belt rank', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'green',
        team: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('team', () => {
    it('allows empty team (optional)', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects team over 50 characters', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: 'A'.repeat(51),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Team must be 50 characters or less');
      }
    });

    it('accepts valid team name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: 'Gracie Barra',
      });

      expect(result.success).toBe(true);
    });

    it('transforms to trimmed value on output', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: '  Alliance  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.team).toBe('Alliance');
      }
    });
  });
});
