import { describe, it, expect, beforeAll, vi } from 'vitest';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { compositeImage } from '../composite.js';
import { createCanvas } from '../canvas.js';
import { InvalidInputError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '__fixtures__');
const EXAMPLES_DIR = join(__dirname, '../../../../..', 'docs/examples');
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

beforeAll(async () => {
  if (!existsSync(EXAMPLES_DIR)) {
    await mkdir(EXAMPLES_DIR, { recursive: true });
  }
});

/**
 * Compare result buffer to snapshot, allowing small differences
 */
async function compareToSnapshot(result: Buffer, snapshotName: string): Promise<void> {
  const snapshotPath = join(EXAMPLES_DIR, `${snapshotName}.png`);

  if (UPDATE_SNAPSHOTS || !existsSync(snapshotPath)) {
    await writeFile(snapshotPath, result);
    return;
  }

  const snapshot = readFileSync(snapshotPath);

  const resultRaw = await sharp(result).raw().toBuffer({ resolveWithObject: true });
  const snapshotRaw = await sharp(snapshot).raw().toBuffer({ resolveWithObject: true });

  // Count pixels that differ significantly
  let diffPixels = 0;
  for (let i = 0; i < resultRaw.data.length; i++) {
    if (Math.abs(resultRaw.data[i] - snapshotRaw.data[i]) > 10) {
      diffPixels++;
    }
  }

  const totalPixels = resultRaw.info.width * resultRaw.info.height * resultRaw.info.channels;
  const diffPercent = (diffPixels / totalPixels) * 100;

  expect(diffPercent).toBeLessThan(1);
}

describe('compositeImage', () => {
  describe('positioning', () => {
    it('composites photo at center position', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: 'center' }],
      });

      const buffer = await result.png().toBuffer();

      // Verify the result is a valid image
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(500);

      // Verify athlete is centered (by checking center pixel color is from athlete)
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      // Center pixel should be part of the athlete (reddish color from gradient)
      const centerIdx = (250 * 400 + 200) * 4; // y=250, x=200
      expect(data[centerIdx]).toBeGreaterThan(150); // R channel should be high

      await compareToSnapshot(buffer, 'composite-center');
    });

    it('composites photo at top-center position', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: 'top-center' }],
      });

      const buffer = await result.png().toBuffer();

      // Verify athlete is at top-center
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      // Top center pixel (y=100, x=200) should be part of athlete
      const topCenterIdx = (100 * 400 + 200) * 4;
      expect(data[topCenterIdx]).toBeGreaterThan(150); // R channel
      // Bottom pixel (y=450, x=200) should be background color
      const bottomIdx = (450 * 400 + 200) * 4;
      expect(data[bottomIdx]).toBe(26); // Background R channel

      await compareToSnapshot(buffer, 'composite-top-center');
    });

    it('composites photo at bottom-center position', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: 'bottom-center' }],
      });

      const buffer = await result.png().toBuffer();

      // Verify athlete is at bottom-center
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      // Bottom center pixel (y=400, x=200) should be part of athlete
      const bottomCenterIdx = (400 * 400 + 200) * 4;
      expect(data[bottomCenterIdx]).toBeGreaterThan(150); // R channel
      // Top pixel (y=50, x=200) should be background color
      const topIdx = (50 * 400 + 200) * 4;
      expect(data[topIdx]).toBe(26); // Background R channel

      await compareToSnapshot(buffer, 'composite-bottom-center');
    });

    it('composites photo at exact x/y coordinates', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: { x: 100, y: 200 } }],
      });

      const buffer = await result.png().toBuffer();

      // Verify athlete is at x:100, y:200
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      // Pixel at (x:150, y:250) should be in the athlete area
      const athleteIdx = (250 * 400 + 150) * 4;
      expect(data[athleteIdx]).toBeGreaterThan(150); // R channel
      // Pixel at (x:50, y:100) should be background
      const bgIdx = (100 * 400 + 50) * 4;
      expect(data[bgIdx]).toBe(26); // Background R channel

      await compareToSnapshot(buffer, 'composite-xy-position');
    });

    it('composites photo at left-center position', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: 'left-center' }],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-left-center');
    });

    it('composites photo at right-center position', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: athlete, position: 'right-center' }],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-right-center');
    });
  });

  describe('resizing', () => {
    it('resizes photo to specified width maintaining aspect ratio', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete-large.png')); // 800x800

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            size: { width: 200 }, // Should become 200x200 (1:1 ratio preserved)
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-resize-width');
    });

    it('resizes photo to specified height maintaining aspect ratio', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete-large.png')); // 800x800

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            size: { height: 150 }, // Should become 150x150
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-resize-height');
    });

    it('handles photo larger than canvas by scaling', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const largeAthlete = await readFile(join(FIXTURES_DIR, 'athlete-large.png')); // 800x800

      const result = await compositeImage({
        background,
        layers: [
          {
            image: largeAthlete,
            position: 'center',
            size: { width: 300 },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-large-photo');
    });

    it('logs warning when scaling up a small photo', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const smallAthlete = await readFile(join(FIXTURES_DIR, 'athlete-small.png')); // 50x50

      await compositeImage({
        background,
        layers: [
          {
            image: smallAthlete,
            position: 'center',
            size: { width: 200 }, // Scaling up from 50 to 200
          },
        ],
      });

      // Logger uses console.warn internally, check for the structured log message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scaling up image may reduce quality')
      );

      consoleSpy.mockRestore();
    });

    it('throws for zero resize width', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              size: { width: 0 },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative resize width', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              size: { width: -100 },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for zero resize height', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              size: { height: 0 },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative resize height', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              size: { height: -100 },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('masking', () => {
    it('applies circle mask to photo', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'circle' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-circle-mask');
    });

    it('applies rounded-rect mask with specified radius', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'rounded-rect', radius: 20 },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-rounded-rect-mask');
    });

    it('handles mask type none (no change)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'none' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      // Should look the same as without mask
      await compareToSnapshot(buffer, 'composite-no-mask');
    });
  });

  describe('border', () => {
    it('adds 4px white border around photo', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            border: { width: 4, color: '#ffffff' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-border');
    });

    it('adds gold border with circle mask', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'circle' },
            border: { width: 4, color: '#ffd700' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-circle-border');
    });

    it('adds border with rounded-rect mask', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'rounded-rect', radius: 20 },
            border: { width: 4, color: '#ffd700' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-rounded-rect-border');
    });

    it('throws for invalid border color', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              border: { width: 4, color: 'invalid' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative border width', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              border: { width: -5, color: '#ffffff' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for border width exceeding maximum (200px)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              border: { width: 201, color: '#ffffff' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('shadow', () => {
    it('adds drop shadow behind photo', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-shadow');
    });

    it('adds shadow with hex color', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            shadow: { blur: 15, offsetX: 5, offsetY: 5, color: '#000000' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-shadow-hex');
    });

    it('adds shadow with circle mask', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'circle' },
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-circle-shadow');
    });

    it('throws for invalid shadow color', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'invalid' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative shadow blur', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              shadow: { blur: -5, offsetX: 0, offsetY: 10, color: '#000000' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for shadow blur exceeding maximum (100)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              shadow: { blur: 101, offsetX: 0, offsetY: 10, color: '#000000' },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('opacity', () => {
    it('applies 50% opacity to photo (semi-transparent)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            opacity: 0.5,
          },
        ],
      });

      const buffer = await result.png().toBuffer();

      // Verify the center pixel is a blend of athlete and background
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      const centerIdx = (250 * 400 + 200) * 4;
      // The red value should be reduced due to blending
      expect(data[centerIdx]).toBeLessThan(200);
      expect(data[centerIdx]).toBeGreaterThan(50);

      await compareToSnapshot(buffer, 'composite-opacity');
    });

    it('handles opacity of 1 (fully opaque)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            opacity: 1,
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-opacity-full');
    });

    it('throws for invalid opacity', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              opacity: 1.5,
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);

      await expect(
        compositeImage({
          background,
          layers: [
            {
              image: athlete,
              position: 'center',
              opacity: -0.5,
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('multiple layers', () => {
    it('composites 3 layers in correct order', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));
      const badge = await readFile(join(FIXTURES_DIR, 'badge.png'));
      const logo = await readFile(join(FIXTURES_DIR, 'logo.png'));

      const result = await compositeImage({
        background,
        layers: [
          { image: athlete, position: 'center' },
          { image: badge, position: 'top-center' },
          { image: logo, position: 'bottom-center' },
        ],
      });

      const buffer = await result.png().toBuffer();

      // Verify dimensions
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(500);

      await compareToSnapshot(buffer, 'composite-multiple-layers');
    });

    it('composites layers with different options', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete.png'));
      const badge = await readFile(join(FIXTURES_DIR, 'badge.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            mask: { type: 'circle' },
            border: { width: 4, color: '#ffd700' },
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
          },
          {
            image: badge,
            position: { x: 280, y: 50 },
            size: { width: 80 },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-layers-with-effects');
    });
  });

  describe('edge cases', () => {
    it('handles transparent PNG photo (transparency preserved)', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const transparentAthlete = await readFile(join(FIXTURES_DIR, 'athlete-transparent.png'));

      const result = await compositeImage({
        background,
        layers: [{ image: transparentAthlete, position: 'center' }],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-transparent-png');
    });

    it('handles JPEG photo (no alpha) with circle mask', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      // Create a JPEG buffer from an existing PNG
      const athletePng = await readFile(join(FIXTURES_DIR, 'athlete.png'));
      const athleteJpeg = await sharp(athletePng).jpeg().toBuffer();

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athleteJpeg,
            position: 'center',
            mask: { type: 'circle' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();

      // Verify it produces valid output
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(500);

      await compareToSnapshot(buffer, 'composite-jpeg-with-mask');
    });

    it('accepts Sharp instance as layer image', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const athleteBuffer = await readFile(join(FIXTURES_DIR, 'athlete.png'));
      const athleteSharp = sharp(athleteBuffer);

      const result = await compositeImage({
        background,
        layers: [{ image: athleteSharp, position: 'center' }],
      });

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(500);
    });

    it('returns original background when no layers provided', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: { type: 'solid', color: '#1a1a2e' },
      });

      const result = await compositeImage({
        background,
        layers: [],
      });

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(500);
    });

    it('combines resize, mask, border, and shadow', async () => {
      const background = await createCanvas({
        width: 400,
        height: 500,
        fill: {
          type: 'gradient',
          direction: 'to-bottom',
          stops: [
            { color: '#1a1a2e', position: 0 },
            { color: '#16213e', position: 100 },
          ],
        },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete-large.png'));

      const result = await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            size: { width: 250 },
            mask: { type: 'circle' },
            border: { width: 4, color: '#ffd700' },
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      await compareToSnapshot(buffer, 'composite-full-effects');
    });
  });

  describe('performance', () => {
    it('completes compositing in less than 500ms for typical poster size', async () => {
      const background = await createCanvas({
        width: 1080,
        height: 1350,
        fill: {
          type: 'gradient',
          direction: 'to-bottom',
          stops: [
            { color: '#1a1a2e', position: 0 },
            { color: '#16213e', position: 100 },
          ],
        },
      });

      const athlete = await readFile(join(FIXTURES_DIR, 'athlete-large.png'));

      const startTime = Date.now();

      await compositeImage({
        background,
        layers: [
          {
            image: athlete,
            position: 'center',
            size: { width: 600 },
            mask: { type: 'circle' },
            border: { width: 4, color: '#ffd700' },
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
          },
        ],
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });
});
