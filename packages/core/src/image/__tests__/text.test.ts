import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { addText } from '../text.js';
import { createCanvas } from '../canvas.js';
import {
  registerFont,
  initBundledFonts,
  clearFonts,
  listFonts,
  isFontRegistered,
} from '../fonts.js';
import { InvalidInputError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '../../../../..', 'docs/examples');
const FONTS_DIR = join(__dirname, '../../../assets/fonts');
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

beforeAll(async () => {
  if (!existsSync(EXAMPLES_DIR)) {
    await mkdir(EXAMPLES_DIR, { recursive: true });
  }
});

afterEach(() => {
  clearFonts();
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

describe('addText', () => {
  describe('basic text rendering', () => {
    it('renders text at center position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Hello World',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(200);
      await compareToSnapshot(buffer, 'text-center');
    });

    it('renders text at explicit x,y position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Custom Position',
            position: { x: 50, y: 100 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('returns image unchanged when no layers provided', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#ff0000' },
      });

      const result = await addText({
        image: canvas,
        layers: [],
      });

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
    });
  });

  describe('text styling', () => {
    it('renders text with custom font size', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Large Text',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-large-size');
    });

    it('renders text with custom color', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Red Text',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ff0000',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-red-color');
    });

    it('renders text with center alignment', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Centered',
            position: { x: 200, y: 100 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('renders text with right alignment', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Right Aligned',
            position: { x: 380, y: 100 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
              align: 'right',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('text transforms', () => {
    it('transforms text to uppercase', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'hello world',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
              textTransform: 'uppercase',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-uppercase');
    });

    it('transforms text to lowercase', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'HELLO WORLD',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
              textTransform: 'lowercase',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('capitalizes text', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'hello world',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
              textTransform: 'capitalize',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('text effects', () => {
    it('renders text with stroke/outline', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Outlined',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
              stroke: { width: 2, color: '#ff0000' },
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-stroke');
    });

    it('renders text with drop shadow', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#cccccc' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Shadow',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 48,
              color: '#000000',
              align: 'center',
              shadow: { blur: 4, offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,0.5)' },
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-shadow');
    });

    it('renders text with letter spacing', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'SPACED',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
              letterSpacing: 10,
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-letter-spacing');
    });
  });

  describe('auto-sizing with maxWidth', () => {
    it('shrinks font to fit maxWidth', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'This is a very long text that should shrink',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
              maxWidth: 350,
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-max-width');
    });
  });

  describe('multiple text layers', () => {
    it('renders multiple text layers', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 300,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Title',
            position: { x: 200, y: 60 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
            },
          },
          {
            content: 'Subtitle here',
            position: { x: 200, y: 120 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#cccccc',
              align: 'center',
            },
          },
          {
            content: 'Footer text',
            position: { x: 200, y: 260 },
            style: {
              fontFamily: 'sans-serif',
              fontSize: 16,
              color: '#888888',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-multiple-layers');
    });
  });

  describe('custom fonts', () => {
    const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
    const fontExists = existsSync(fontPath);

    it.skipIf(!fontExists)('renders with registered custom font', async () => {
      await registerFont('Oswald-Bold', fontPath);
      expect(isFontRegistered('Oswald-Bold')).toBe(true);

      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'OSWALD FONT',
            position: 'center',
            style: {
              fontFamily: 'Oswald-Bold',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      await compareToSnapshot(buffer, 'text-oswald-font');
    });

    it('falls back to system font when font not registered', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      // This should not throw, just use fallback font
      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Fallback Font',
            position: 'center',
            style: {
              fontFamily: 'NonExistentFont',
              fontSize: 32,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('initializes bundled fonts and returns result object', async () => {
      const result = await initBundledFonts();

      // Result should have the correct shape
      expect(result).toHaveProperty('loaded');
      expect(result).toHaveProperty('failed');
      expect(Array.isArray(result.loaded)).toBe(true);
      expect(Array.isArray(result.failed)).toBe(true);

      // If fonts directory exists, we should have loaded some fonts
      const fontsDir = join(FONTS_DIR);
      if (existsSync(fontsDir)) {
        // At least one font should have loaded or failed (not silently ignored)
        expect(result.loaded.length + result.failed.length).toBeGreaterThan(0);
      }

      // Verify fonts are actually registered
      const fonts = listFonts();
      expect(fonts.length).toBe(result.loaded.length);
    });
  });

  describe('validation errors', () => {
    it('throws for invalid font size (too small)', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 0,
                color: '#ffffff',
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid font size (too large)', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 1000,
                color: '#ffffff',
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid text color', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: 'invalid',
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid stroke color', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                stroke: { width: 2, color: 'bad' },
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative stroke width', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                stroke: { width: -1, color: '#ff0000' },
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for negative shadow blur', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                shadow: { blur: -1, offsetX: 0, offsetY: 0, color: '#000000' },
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid maxWidth', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                maxWidth: 0,
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for empty font family', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: '',
                fontSize: 16,
                color: '#ffffff',
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for letter spacing exceeding maximum', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                letterSpacing: 150, // Exceeds MAX_LETTER_SPACING (100)
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for stroke width exceeding maximum', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                stroke: { width: 60, color: '#ff0000' }, // Exceeds MAX_STROKE_WIDTH (50)
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for non-number letter spacing', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                letterSpacing: 'wide' as unknown as number, // Invalid type
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for shadow blur exceeding maximum', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                shadow: { blur: 150, offsetX: 0, offsetY: 0, color: '#000000' }, // Exceeds MAX_BLUR (100)
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for invalid shadow color', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffffff',
                shadow: { blur: 4, offsetX: 0, offsetY: 0, color: 'invalid-color' },
              },
            },
          ],
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws for unregistered font when strictFont is enabled', async () => {
      const canvas = await createCanvas({
        width: 100,
        height: 100,
        fill: { type: 'solid', color: '#000000' },
      });

      await expect(
        addText({
          image: canvas,
          layers: [
            {
              content: 'Test',
              position: 'center',
              style: {
                fontFamily: 'NonExistentFont',
                fontSize: 16,
                color: '#ffffff',
              },
            },
          ],
          strictFont: true,
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('named positions', () => {
    it('renders at top-center position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Top Center',
            position: 'top-center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('renders at bottom-center position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Bottom Center',
            position: 'bottom-center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('security', () => {
    it('escapes XSS attempts in text content', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      // This should not throw and the malicious content should be escaped
      const result = await addText({
        image: canvas,
        layers: [
          {
            content: '<script>alert("xss")</script>',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 16,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      // The text should be rendered (escaped), not executed
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('escapes SVG injection attempts in text content', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: '"></text><image href="http://evil.com/steal.png"/>',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 16,
              color: '#ffffff',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Buffer input', () => {
    it('accepts Buffer as image input instead of Sharp instance', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      // Convert Sharp instance to Buffer
      const imageBuffer = await canvas.png().toBuffer();

      // Pass Buffer directly to addText
      const result = await addText({
        image: imageBuffer,
        layers: [
          {
            content: 'Buffer Input Test',
            position: 'center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
              align: 'center',
            },
          },
        ],
      });

      const outputBuffer = await result.png().toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      expect(outputBuffer).toBeInstanceOf(Buffer);
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(200);
    });
  });

  describe('named positions extended', () => {
    it('renders at left-center position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Left Center',
            position: 'left-center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('renders at right-center position', async () => {
      const canvas = await createCanvas({
        width: 400,
        height: 200,
        fill: { type: 'solid', color: '#1a1a1a' },
      });

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'Right Center',
            position: 'right-center',
            style: {
              fontFamily: 'sans-serif',
              fontSize: 24,
              color: '#ffffff',
              align: 'right',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('poster-style example', () => {
    it('generates poster-style text layout', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      const robotoPath = join(FONTS_DIR, 'Roboto-Regular.ttf');

      if (existsSync(fontPath)) {
        await registerFont('Oswald-Bold', fontPath);
      }
      if (existsSync(robotoPath)) {
        await registerFont('Roboto-Regular', robotoPath);
      }

      const canvas = await createCanvas({
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

      const result = await addText({
        image: canvas,
        layers: [
          {
            content: 'WORLD CHAMPIONSHIP 2025',
            position: { x: 540, y: 150 },
            style: {
              fontFamily: isFontRegistered('Oswald-Bold') ? 'Oswald-Bold' : 'sans-serif',
              fontSize: 48,
              color: '#ffffff',
              align: 'center',
              textTransform: 'uppercase',
              letterSpacing: 4,
            },
          },
          {
            content: 'JOHN DOE',
            position: { x: 540, y: 950 },
            style: {
              fontFamily: isFontRegistered('Oswald-Bold') ? 'Oswald-Bold' : 'sans-serif',
              fontSize: 64,
              color: '#ffffff',
              align: 'center',
              textTransform: 'uppercase',
              letterSpacing: 2,
            },
          },
          {
            content: 'Black Belt - 2nd Degree',
            position: { x: 540, y: 1020 },
            style: {
              fontFamily: isFontRegistered('Roboto-Regular') ? 'Roboto-Regular' : 'sans-serif',
              fontSize: 32,
              color: '#ffd700',
              align: 'center',
            },
          },
          {
            content: 'June 15, 2025',
            position: { x: 540, y: 1200 },
            style: {
              fontFamily: isFontRegistered('Roboto-Regular') ? 'Roboto-Regular' : 'sans-serif',
              fontSize: 28,
              color: '#cccccc',
              align: 'center',
            },
          },
          {
            content: 'Las Vegas, NV',
            position: { x: 540, y: 1240 },
            style: {
              fontFamily: isFontRegistered('Roboto-Regular') ? 'Roboto-Regular' : 'sans-serif',
              fontSize: 24,
              color: '#999999',
              align: 'center',
            },
          },
        ],
      });

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
      await compareToSnapshot(buffer, 'text-poster-layout');
    });
  });
});
