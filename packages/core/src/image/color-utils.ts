import { InvalidInputError } from './errors.js';

/**
 * RGBA color object
 */
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

/**
 * RGB color object (without alpha)
 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Validate hex color format (#rrggbb)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Parse hex color to RGB values
 * @throws {InvalidInputError} When hex format is invalid
 */
export function hexToRgb(hex: string): RgbColor {
  const result = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!result) {
    throw new InvalidInputError(`Invalid hex color format: ${hex}. Expected format: #rrggbb`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Parse hex color to RGBA values (with alpha = 1)
 * @throws {InvalidInputError} When hex format is invalid
 */
export function hexToRgba(hex: string): RgbaColor {
  const rgb = hexToRgb(hex);
  return { ...rgb, alpha: 1 };
}

/**
 * Parse rgba() color string to RGBA values
 * @returns RgbaColor or null if not a valid rgba format
 */
export function parseRgbaColor(color: string): RgbaColor | null {
  const rgbaMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(color);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      alpha: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return null;
}

/**
 * Parse any color string (hex or rgba) to RGBA values
 * @throws {InvalidInputError} When color format is invalid
 */
export function parseColor(color: string): RgbaColor {
  const rgba = parseRgbaColor(color);
  if (rgba) return rgba;
  return hexToRgba(color);
}
