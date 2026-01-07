import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { composePoster } from '../compose-poster.js';
import { initBundledFonts } from '../fonts.js';
import { TemplateNotFoundError } from '../../templates/errors.js';
import { InvalidInputError } from '../errors.js';

describe('composePoster', () => {
  // Create a valid test image
  let validPhoto: Buffer;

  beforeAll(async () => {
    await initBundledFonts();
    // Create a simple 100x100 red image for testing
    validPhoto = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  describe('validation', () => {
    it('throws TemplateNotFoundError for invalid template ID', async () => {
      await expect(
        composePoster({
          templateId: 'nonexistent-template',
          athletePhoto: validPhoto,
          data: {},
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('throws InvalidInputError when required data fields are missing', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' }, // Missing other required fields
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError with list of missing fields', async () => {
      try {
        await composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' },
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as Error).message).toContain('Missing required data fields');
        expect((error as Error).message).toContain('achievement');
        expect((error as Error).message).toContain('tournamentName');
        expect((error as Error).message).toContain('date');
      }
    });

    it('throws InvalidInputError for invalid photo buffer', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: Buffer.from('not an image'),
          data: {
            athleteName: 'Test',
            achievement: 'Gold',
            tournamentName: 'Worlds',
            date: '2025',
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });
});
