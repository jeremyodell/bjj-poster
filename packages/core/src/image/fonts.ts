import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';
import { FontLoadError, InvalidInputError } from './errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Registered font information
 */
interface RegisteredFont {
  name: string;
  path: string;
  data: Buffer;
}

// In-memory font registry
const fontRegistry = new Map<string, RegisteredFont>();

// Path to bundled fonts
const BUNDLED_FONTS_DIR = join(__dirname, '../../assets/fonts');

// Default system font to use as fallback
const DEFAULT_FONT = 'sans-serif';

/**
 * Bundled fonts that are available out of the box
 */
const BUNDLED_FONTS: Record<string, string> = {
  'Oswald-Bold': 'Oswald-Bold.ttf',
  'Roboto-Regular': 'Roboto-Regular.ttf',
  'BebasNeue-Regular': 'BebasNeue-Regular.ttf',
};

/**
 * Register a custom font for use in text rendering.
 *
 * @param name - Font family name to reference in TextStyle.fontFamily
 * @param path - Path to .ttf or .otf file
 * @throws {FontLoadError} When the font file cannot be loaded
 * @throws {InvalidInputError} When the path is invalid
 *
 * @example
 * ```typescript
 * await registerFont('MyFont', '/path/to/font.ttf');
 * // Now use 'MyFont' in TextStyle.fontFamily
 * ```
 */
export async function registerFont(name: string, path: string): Promise<void> {
  if (!name || typeof name !== 'string') {
    throw new InvalidInputError('Font name must be a non-empty string');
  }

  if (!path || typeof path !== 'string') {
    throw new InvalidInputError('Font path must be a non-empty string');
  }

  const ext = path.toLowerCase();
  if (!ext.endsWith('.ttf') && !ext.endsWith('.otf')) {
    throw new InvalidInputError('Font file must be .ttf or .otf format');
  }

  if (!existsSync(path)) {
    throw new FontLoadError(name, `File not found: ${path}`);
  }

  try {
    const data = await readFile(path);
    fontRegistry.set(name, { name, path, data });
    logger.debug('Font registered', { name, path });
  } catch (error) {
    throw new FontLoadError(
      name,
      error instanceof Error ? error.message : 'Unknown error reading font file'
    );
  }
}

/**
 * Get a registered font by name.
 * Returns the font data if found, or null if not registered.
 *
 * @param name - Font family name
 * @returns Font data buffer or null
 */
export function getFont(name: string): Buffer | null {
  const font = fontRegistry.get(name);
  return font ? font.data : null;
}

/**
 * Check if a font is registered.
 *
 * @param name - Font family name
 * @returns True if the font is registered
 */
export function isFontRegistered(name: string): boolean {
  return fontRegistry.has(name);
}

/**
 * List all registered font names.
 *
 * @returns Array of registered font family names
 */
export function listFonts(): string[] {
  return Array.from(fontRegistry.keys());
}

/**
 * Get the default fallback font name.
 *
 * @returns Default system font name
 */
export function getDefaultFont(): string {
  return DEFAULT_FONT;
}

/**
 * Result from initializing bundled fonts
 */
export interface InitBundledFontsResult {
  /** Fonts that were successfully loaded */
  loaded: string[];
  /** Fonts that failed to load with their error messages */
  failed: Array<{ name: string; reason: string }>;
}

/**
 * Initialize bundled fonts. This registers all fonts that come with the package.
 * Should be called once at startup if you want to use bundled fonts.
 *
 * Note: BUNDLED_FONTS must stay in sync with the files in packages/core/assets/fonts/
 *
 * @returns Result object showing which fonts loaded successfully and which failed
 *
 * @example
 * ```typescript
 * const result = await initBundledFonts();
 * console.log('Loaded fonts:', result.loaded);
 * if (result.failed.length > 0) {
 *   console.warn('Failed to load:', result.failed);
 * }
 * // Now 'Oswald-Bold', 'Roboto-Regular', 'BebasNeue-Regular' are available
 * ```
 */
export async function initBundledFonts(): Promise<InitBundledFontsResult> {
  const result: InitBundledFontsResult = {
    loaded: [],
    failed: [],
  };

  for (const [name, filename] of Object.entries(BUNDLED_FONTS)) {
    const fontPath = join(BUNDLED_FONTS_DIR, filename);
    if (existsSync(fontPath)) {
      try {
        await registerFont(name, fontPath);
        result.loaded.push(name);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        result.failed.push({ name, reason });
        logger.error('Failed to load bundled font', { name, error });
      }
    } else {
      const reason = `File not found: ${fontPath}`;
      result.failed.push({ name, reason });
      logger.error('Bundled font file not found', { name, path: fontPath });
    }
  }

  return result;
}

/**
 * Get list of bundled font names (whether or not they are loaded).
 *
 * @returns Array of bundled font names
 */
export function listBundledFonts(): string[] {
  return Object.keys(BUNDLED_FONTS);
}

/**
 * Clear all registered fonts.
 * Useful for testing.
 */
export function clearFonts(): void {
  fontRegistry.clear();
}
