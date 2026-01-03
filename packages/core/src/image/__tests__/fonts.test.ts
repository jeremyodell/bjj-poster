import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  registerFont,
  getFont,
  isFontRegistered,
  listFonts,
  getDefaultFont,
  initBundledFonts,
  listBundledFonts,
  clearFonts,
} from '../fonts.js';
import { FontLoadError, InvalidInputError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, '../../../assets/fonts');

beforeEach(() => {
  clearFonts();
});

afterEach(() => {
  clearFonts();
});

describe('font management', () => {
  describe('registerFont', () => {
    it('registers a font from file path', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      if (!existsSync(fontPath)) {
        // Skip if font not available
        return;
      }

      await registerFont('TestOswald', fontPath);

      expect(isFontRegistered('TestOswald')).toBe(true);
      expect(listFonts()).toContain('TestOswald');
    });

    it('returns font data after registration', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      if (!existsSync(fontPath)) {
        return;
      }

      await registerFont('TestFont', fontPath);

      const fontData = getFont('TestFont');
      expect(fontData).toBeInstanceOf(Buffer);
      expect(fontData!.length).toBeGreaterThan(0);
    });

    it('throws FontLoadError for non-existent file', async () => {
      await expect(
        registerFont('Missing', '/path/to/nonexistent/font.ttf')
      ).rejects.toThrow(FontLoadError);
    });

    it('throws InvalidInputError for empty name', async () => {
      await expect(registerFont('', '/some/path.ttf')).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError for empty path', async () => {
      await expect(registerFont('Font', '')).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError for non-ttf/otf file', async () => {
      await expect(registerFont('Font', '/path/to/font.woff')).rejects.toThrow(InvalidInputError);
    });

    it('accepts .otf files', async () => {
      // Just verify the extension check passes for .otf
      await expect(registerFont('Font', '/nonexistent/font.otf')).rejects.toThrow(FontLoadError);
      // The error should be about file not found, not about invalid extension
    });
  });

  describe('getFont', () => {
    it('returns null for unregistered font', () => {
      const result = getFont('UnknownFont');
      expect(result).toBeNull();
    });

    it('returns buffer for registered font', async () => {
      const fontPath = join(FONTS_DIR, 'Roboto-Regular.ttf');
      if (!existsSync(fontPath)) {
        return;
      }

      await registerFont('Roboto', fontPath);

      const result = getFont('Roboto');
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('isFontRegistered', () => {
    it('returns false for unregistered font', () => {
      expect(isFontRegistered('NotRegistered')).toBe(false);
    });

    it('returns true for registered font', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      if (!existsSync(fontPath)) {
        return;
      }

      await registerFont('Oswald', fontPath);
      expect(isFontRegistered('Oswald')).toBe(true);
    });
  });

  describe('listFonts', () => {
    it('returns empty array initially', () => {
      expect(listFonts()).toEqual([]);
    });

    it('returns registered font names', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      const robotoPath = join(FONTS_DIR, 'Roboto-Regular.ttf');

      if (existsSync(fontPath)) {
        await registerFont('Oswald', fontPath);
      }
      if (existsSync(robotoPath)) {
        await registerFont('Roboto', robotoPath);
      }

      const fonts = listFonts();

      if (existsSync(fontPath)) {
        expect(fonts).toContain('Oswald');
      }
      if (existsSync(robotoPath)) {
        expect(fonts).toContain('Roboto');
      }
    });
  });

  describe('getDefaultFont', () => {
    it('returns a default font name', () => {
      const defaultFont = getDefaultFont();
      expect(typeof defaultFont).toBe('string');
      expect(defaultFont.length).toBeGreaterThan(0);
    });
  });

  describe('clearFonts', () => {
    it('removes all registered fonts', async () => {
      const fontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      if (existsSync(fontPath)) {
        await registerFont('TestFont', fontPath);
        expect(listFonts().length).toBeGreaterThan(0);
      }

      clearFonts();

      expect(listFonts()).toEqual([]);
    });
  });

  describe('bundled fonts', () => {
    it('lists bundled font names', () => {
      const bundled = listBundledFonts();

      expect(bundled).toContain('Oswald-Bold');
      expect(bundled).toContain('Roboto-Regular');
      expect(bundled).toContain('BebasNeue-Regular');
    });

    it('initializes bundled fonts and returns result object', async () => {
      const result = await initBundledFonts();

      // Result should have the correct shape
      expect(result).toHaveProperty('loaded');
      expect(result).toHaveProperty('failed');
      expect(Array.isArray(result.loaded)).toBe(true);
      expect(Array.isArray(result.failed)).toBe(true);

      // Check each bundled font - should be registered if file exists
      const bundledFontPath = join(FONTS_DIR, 'Oswald-Bold.ttf');
      if (existsSync(bundledFontPath)) {
        expect(result.loaded).toContain('Oswald-Bold');
        expect(listFonts()).toContain('Oswald-Bold');
      }
    });

    it('registers all available bundled fonts', async () => {
      const result = await initBundledFonts();

      const fonts = listFonts();
      const bundled = listBundledFonts();

      // Each bundled font that exists should be registered
      for (const fontName of bundled) {
        const fontPath = join(FONTS_DIR, `${fontName.replace('-', '-')}.ttf`);
        if (existsSync(fontPath)) {
          expect(fonts).toContain(fontName);
          expect(result.loaded).toContain(fontName);
        }
      }

      // Verify that loaded + failed accounts for all bundled fonts
      expect(result.loaded.length + result.failed.length).toBe(bundled.length);
    });

    it('reports failed fonts in result when files are missing', async () => {
      // This test verifies the structure of failed entries
      const result = await initBundledFonts();

      // Each failed entry should have name and reason
      for (const failed of result.failed) {
        expect(failed).toHaveProperty('name');
        expect(failed).toHaveProperty('reason');
        expect(typeof failed.name).toBe('string');
        expect(typeof failed.reason).toBe('string');
      }
    });
  });
});
