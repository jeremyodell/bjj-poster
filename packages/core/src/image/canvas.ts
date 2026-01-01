import sharp, { Sharp } from 'sharp';
import { InvalidInputError } from './errors.js';
import { isValidHexColor, hexToRgb } from './color-utils.js';
import type { CanvasOptions, GradientStop, GradientDirection } from './types.js';

const MAX_DIMENSION = 10000;
const MIN_DIMENSION = 1;

/**
 * Validate canvas dimensions
 */
function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new InvalidInputError('Canvas dimensions must be integers');
  }
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new InvalidInputError(`Canvas dimensions must be at least ${MIN_DIMENSION}px`);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new InvalidInputError(`Canvas dimensions must not exceed ${MAX_DIMENSION}px`);
  }
}

/**
 * Validate gradient stops
 */
function validateGradientStops(stops: GradientStop[]): void {
  if (stops.length < 2) {
    throw new InvalidInputError('Gradient must have at least 2 color stops');
  }
  if (stops.length > 4) {
    throw new InvalidInputError('Gradient must have at most 4 color stops');
  }
  for (const stop of stops) {
    if (!isValidHexColor(stop.color)) {
      throw new InvalidInputError(`Invalid hex color: ${stop.color}. Expected format: #rrggbb`);
    }
    if (stop.position < 0 || stop.position > 100) {
      throw new InvalidInputError(`Gradient stop position must be between 0 and 100, got: ${stop.position}`);
    }
  }
}

/**
 * Escape string for safe use in XML/SVG attributes
 */
function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build SVG for linear gradient
 */
function buildLinearGradientSvg(
  width: number,
  height: number,
  direction: Exclude<GradientDirection, 'radial'>,
  stops: GradientStop[]
): string {
  const gradientCoords = {
    'to-bottom': { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
    'to-right': { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
    'to-bottom-right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
  };

  const coords = gradientCoords[direction];
  const stopsSvg = stops
    .map((s) => `<stop offset="${s.position}%" stop-color="${escapeXmlAttr(s.color)}"/>`)
    .join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
      ${stopsSvg}
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
</svg>`;
}

/**
 * Build SVG for radial gradient
 */
function buildRadialGradientSvg(
  width: number,
  height: number,
  stops: GradientStop[]
): string {
  const stopsSvg = stops
    .map((s) => `<stop offset="${s.position}%" stop-color="${escapeXmlAttr(s.color)}"/>`)
    .join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      ${stopsSvg}
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
</svg>`;
}

/**
 * Create a canvas with solid color or gradient background.
 *
 * @param options - Canvas configuration including dimensions and fill
 * @returns Sharp instance for further processing
 * @throws {InvalidInputError} When input validation fails
 *
 * @example
 * ```typescript
 * // Solid color canvas
 * const canvas = await createCanvas({
 *   width: 1080,
 *   height: 1350,
 *   fill: { type: 'solid', color: '#1a1a1a' }
 * });
 *
 * // Gradient canvas
 * const gradient = await createCanvas({
 *   width: 1080,
 *   height: 1350,
 *   fill: {
 *     type: 'gradient',
 *     direction: 'to-bottom',
 *     stops: [
 *       { color: '#1a1a2e', position: 0 },
 *       { color: '#16213e', position: 100 }
 *     ]
 *   }
 * });
 * ```
 */
export async function createCanvas(options: CanvasOptions): Promise<Sharp> {
  const { width, height, fill } = options;

  validateDimensions(width, height);

  if (fill.type === 'solid') {
    if (!isValidHexColor(fill.color)) {
      throw new InvalidInputError(`Invalid hex color: ${fill.color}. Expected format: #rrggbb`);
    }

    const rgb = hexToRgb(fill.color);
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 },
      },
    });
  }

  // Gradient fill
  validateGradientStops(fill.stops);

  let svg: string;
  if (fill.direction === 'radial') {
    svg = buildRadialGradientSvg(width, height, fill.stops);
  } else {
    svg = buildLinearGradientSvg(width, height, fill.direction, fill.stops);
  }

  return sharp(Buffer.from(svg));
}
