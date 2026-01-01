import { describe, it, expect, beforeAll } from 'vitest';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createCanvas } from '../canvas.js';
import { InvalidInputError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '../../../../..', 'docs/examples');
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

beforeAll(async () => {
  if (!existsSync(EXAMPLES_DIR)) {
    await mkdir(EXAMPLES_DIR, { recursive: true });
  }
});

/**
 * Compare result buffer to snapshot in docs/examples, allowing small differences
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

describe('createCanvas', () => {
  describe('solid color', () => {
    it('creates canvas with correct dimensions', async () => {
      const canvas = await createCanvas({
        width: 1080,
        height: 1350,
        fill: { type: 'solid', color: '#000000' },
      });

      const buffer = await canvas.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });

    it('creates canvas with specified hex color', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#ff5733' },
      });

      const buffer = await canvas.png().toBuffer();
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });

      // Check first pixel RGBA values (ff=255, 57=87, 33=51)
      expect(data[0]).toBe(255); // R
      expect(data[1]).toBe(87);  // G
      expect(data[2]).toBe(51);  // B
      expect(data[3]).toBe(255); // A
    });

    it('matches visual snapshot for solid color', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-solid');
    });
  });

  describe('linear gradient', () => {
    it('creates vertical gradient (to-bottom)', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'to-bottom',
          stops: [
            { color: '#000000', position: 0 },
            { color: '#ffffff', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(200);
      expect(metadata.height).toBe(200);
      await compareToSnapshot(buffer, 'canvas-gradient-vertical');
    });

    it('creates horizontal gradient (to-right)', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'to-right',
          stops: [
            { color: '#ff5733', position: 0 },
            { color: '#3357ff', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-gradient-horizontal');
    });

    it('creates diagonal gradient (to-bottom-right)', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'to-bottom-right',
          stops: [
            { color: '#1a1a2e', position: 0 },
            { color: '#16213e', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-gradient-diagonal');
    });
  });

  describe('radial gradient', () => {
    it('creates radial gradient with 2 stops', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'radial',
          stops: [
            { color: '#ffffff', position: 0 },
            { color: '#000000', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-radial-2stops');
    });

    it('creates radial gradient with 3 stops', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'radial',
          stops: [
            { color: '#ffffff', position: 0 },
            { color: '#ff5733', position: 50 },
            { color: '#000000', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-radial-3stops');
    });

    it('creates radial gradient with 4 stops', async () => {
      const canvas = await createCanvas({
        width: 200,
        height: 200,
        fill: {
          type: 'gradient',
          direction: 'radial',
          stops: [
            { color: '#ffffff', position: 0 },
            { color: '#ffcc00', position: 33 },
            { color: '#ff5733', position: 66 },
            { color: '#000000', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-radial-4stops');
    });
  });

  describe('output formats', () => {
    it('outputs PNG buffer', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#ff5733' },
      });

      const buffer = await canvas.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.format).toBe('png');
    });

    it('outputs JPEG buffer', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#ff5733' },
      });

      const buffer = await canvas.jpeg().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.format).toBe('jpeg');
    });
  });

  describe('validation errors', () => {
    it('throws for invalid hex color (missing #)', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: { type: 'solid', color: 'ff5733' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid hex color (wrong length)', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: { type: 'solid', color: '#fff' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid hex color (invalid characters)', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: { type: 'solid', color: '#gggggg' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for dimensions too small', async () => {
      await expect(
        createCanvas({
          width: 0,
          height: 100,
          fill: { type: 'solid', color: '#000000' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for dimensions too large', async () => {
      await expect(
        createCanvas({
          width: 100000,
          height: 100,
          fill: { type: 'solid', color: '#000000' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for non-integer dimensions', async () => {
      await expect(
        createCanvas({
          width: 100.5,
          height: 100,
          fill: { type: 'solid', color: '#000000' },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for gradient with less than 2 stops', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: {
            type: 'gradient',
            direction: 'to-bottom',
            stops: [{ color: '#000000', position: 0 }],
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for gradient with more than 4 stops', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: {
            type: 'gradient',
            direction: 'to-bottom',
            stops: [
              { color: '#000000', position: 0 },
              { color: '#333333', position: 25 },
              { color: '#666666', position: 50 },
              { color: '#999999', position: 75 },
              { color: '#ffffff', position: 100 },
            ],
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for gradient with negative stop position', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: {
            type: 'gradient',
            direction: 'to-bottom',
            stops: [
              { color: '#000000', position: -10 },
              { color: '#ffffff', position: 100 },
            ],
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for gradient with stop position exceeding 100', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: {
            type: 'gradient',
            direction: 'to-bottom',
            stops: [
              { color: '#000000', position: 0 },
              { color: '#ffffff', position: 150 },
            ],
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for gradient with invalid color in stops', async () => {
      await expect(
        createCanvas({
          width: 100,
          height: 100,
          fill: {
            type: 'gradient',
            direction: 'to-bottom',
            stops: [
              { color: 'red', position: 0 },
              { color: '#ffffff', position: 100 },
            ],
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('poster-sized examples', () => {
    it('generates poster-sized gradient for documentation', async () => {
      const canvas = await createCanvas({
        width: 1080,
        height: 1350,
        fill: {
          type: 'gradient',
          direction: 'to-bottom',
          stops: [
            { color: '#1a1a2e', position: 0 },
            { color: '#16213e', position: 50 },
            { color: '#0f3460', position: 100 },
          ],
        },
      });

      const buffer = await canvas.png().toBuffer();
      await compareToSnapshot(buffer, 'canvas-poster-background');

      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });
  });
});
