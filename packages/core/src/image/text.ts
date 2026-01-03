import sharp, { Sharp } from 'sharp';
import { logger } from '../logger.js';
import { ImageProcessingError, InvalidInputError } from './errors.js';
import { isValidHexColor, parseColor, parseRgbaColor } from './color-utils.js';
import { getFont, getDefaultFont } from './fonts.js';
import type {
  Position,
  TextStyle,
  TextLayer,
  AddTextOptions,
  TextTransform,
} from './types.js';

const MAX_FONT_SIZE = 500;
const MIN_FONT_SIZE = 1;
const MAX_LETTER_SPACING = 100;
const MAX_STROKE_WIDTH = 50;
const MAX_BLUR = 100;

/**
 * Apply text transform to content
 */
function applyTextTransform(text: string, transform?: TextTransform): string {
  if (!transform || transform === 'none') {
    return text;
  }

  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    default:
      return text;
  }
}

/**
 * Escape special XML characters for SVG.
 * This prevents SVG injection attacks when user-provided text is rendered.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escape font family name for safe use in SVG/CSS attributes.
 * Removes any characters that could break out of the attribute or CSS context.
 */
function escapeFontFamily(fontFamily: string): string {
  // Remove any characters that could break SVG attribute syntax or CSS
  // Includes: quotes, XML entities, CSS-breaking chars (semicolon, braces, backslash)
  return fontFamily.replace(/['"<>&;{}\\]/g, '');
}

/**
 * Get SVG text-anchor from alignment
 */
function getTextAnchor(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
    default:
      return 'start';
  }
}

/**
 * Calculate x position based on alignment and canvas width
 */
function calculateTextX(
  position: Position,
  canvasWidth: number,
  align?: 'left' | 'center' | 'right'
): number {
  // If position has explicit x, use it
  if (typeof position === 'object' && 'x' in position) {
    return position.x;
  }

  // For named positions, calculate based on alignment
  switch (position) {
    case 'center':
    case 'top-center':
    case 'bottom-center':
      return canvasWidth / 2;
    case 'left-center':
      return 0;
    case 'right-center':
      return canvasWidth;
    default:
      // Default based on alignment
      if (align === 'center') return canvasWidth / 2;
      if (align === 'right') return canvasWidth;
      return 0;
  }
}

/**
 * Calculate y position based on position type and canvas height
 */
function calculateTextY(position: Position, canvasHeight: number, fontSize: number): number {
  if (typeof position === 'object' && 'y' in position) {
    return position.y;
  }

  switch (position) {
    case 'center':
    case 'left-center':
    case 'right-center':
      return canvasHeight / 2;
    case 'top-center':
      return fontSize; // Account for baseline
    case 'bottom-center':
      return canvasHeight - fontSize / 4;
    default:
      return canvasHeight / 2;
  }
}

/**
 * Validate text style options
 */
function validateStyle(style: TextStyle): void {
  if (!style.fontFamily || typeof style.fontFamily !== 'string') {
    throw new InvalidInputError('Font family must be a non-empty string');
  }

  if (typeof style.fontSize !== 'number' || style.fontSize < MIN_FONT_SIZE) {
    throw new InvalidInputError(`Font size must be at least ${MIN_FONT_SIZE}px`);
  }

  if (style.fontSize > MAX_FONT_SIZE) {
    throw new InvalidInputError(`Font size exceeds maximum of ${MAX_FONT_SIZE}px`);
  }

  if (!isValidHexColor(style.color)) {
    throw new InvalidInputError(
      `Invalid text color: ${style.color}. Expected format: #rrggbb`
    );
  }

  if (style.letterSpacing !== undefined) {
    if (typeof style.letterSpacing !== 'number') {
      throw new InvalidInputError('Letter spacing must be a number');
    }
    if (Math.abs(style.letterSpacing) > MAX_LETTER_SPACING) {
      throw new InvalidInputError(
        `Letter spacing exceeds maximum of ${MAX_LETTER_SPACING}px`
      );
    }
  }

  if (style.stroke) {
    if (style.stroke.width < 0) {
      throw new InvalidInputError('Stroke width must be non-negative');
    }
    if (style.stroke.width > MAX_STROKE_WIDTH) {
      throw new InvalidInputError(`Stroke width exceeds maximum of ${MAX_STROKE_WIDTH}px`);
    }
    if (!isValidHexColor(style.stroke.color)) {
      throw new InvalidInputError(
        `Invalid stroke color: ${style.stroke.color}. Expected format: #rrggbb`
      );
    }
  }

  if (style.shadow) {
    if (style.shadow.blur < 0) {
      throw new InvalidInputError('Shadow blur must be non-negative');
    }
    if (style.shadow.blur > MAX_BLUR) {
      throw new InvalidInputError(`Shadow blur exceeds maximum of ${MAX_BLUR}px`);
    }
    // Validate shadow color upfront (supports both hex and rgba formats)
    const isHex = isValidHexColor(style.shadow.color);
    const isRgba = parseRgbaColor(style.shadow.color) !== null;
    if (!isHex && !isRgba) {
      throw new InvalidInputError(
        `Invalid shadow color: ${style.shadow.color}. Expected format: #rrggbb or rgba(r,g,b,a)`
      );
    }
  }

  if (style.maxWidth !== undefined && style.maxWidth <= 0) {
    throw new InvalidInputError('maxWidth must be positive');
  }
}

/**
 * Generate font-face CSS for embedded font
 */
function generateFontFace(fontFamily: string, fontData: Buffer): string {
  const base64Font = fontData.toString('base64');
  return `
    @font-face {
      font-family: '${fontFamily}';
      src: url('data:font/truetype;base64,${base64Font}') format('truetype');
    }
  `;
}

/**
 * Build SVG text element for a single layer
 */
function buildTextSvg(
  layer: TextLayer,
  canvasWidth: number,
  canvasHeight: number,
  fontData: Buffer | null,
  effectiveFontSize: number
): string {
  const { content, position, style } = layer;

  // Apply text transform
  const transformedText = applyTextTransform(content, style.textTransform);
  const escapedText = escapeXml(transformedText);

  // Calculate position
  const x = calculateTextX(position, canvasWidth, style.align);
  const y = calculateTextY(position, canvasHeight, effectiveFontSize);

  // Build style string
  const textAnchor = getTextAnchor(style.align);
  const letterSpacing = style.letterSpacing ?? 0;

  // Font family - use the registered font or fallback, escaped for SVG safety
  const fontFamily = escapeFontFamily(fontData ? style.fontFamily : getDefaultFont());

  // Build font-face if we have font data (use escaped font family)
  const fontFace = fontData ? generateFontFace(fontFamily, fontData) : '';

  // Build shadow filter if needed
  let filterDef = '';
  let filterAttr = '';
  if (style.shadow) {
    const shadowColor = parseColor(style.shadow.color);
    const shadowColorStr = `rgba(${shadowColor.r},${shadowColor.g},${shadowColor.b},${shadowColor.alpha})`;
    filterDef = `
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="${style.shadow.offsetX}" dy="${style.shadow.offsetY}"
          stdDeviation="${style.shadow.blur / 2}" flood-color="${shadowColorStr}"/>
      </filter>
    `;
    filterAttr = 'filter="url(#shadow)"';
  }

  // Build text element
  let textElement: string;

  if (style.stroke && style.stroke.width > 0) {
    // Render stroke first (as background), then fill on top for proper text outline effect.
    // The stroke is doubled (width * 2) because SVG strokes are centered on the path,
    // so half would be clipped by the fill layer on top.
    textElement = `
      <text x="${x}" y="${y}"
        font-family="'${fontFamily}'"
        font-size="${effectiveFontSize}"
        text-anchor="${textAnchor}"
        letter-spacing="${letterSpacing}"
        ${filterAttr}>
        <tspan stroke="${style.stroke.color}"
               stroke-width="${style.stroke.width * 2}"
               fill="${style.stroke.color}"
               stroke-linejoin="round">${escapedText}</tspan>
      </text>
      <text x="${x}" y="${y}"
        font-family="'${fontFamily}'"
        font-size="${effectiveFontSize}"
        text-anchor="${textAnchor}"
        letter-spacing="${letterSpacing}"
        fill="${style.color}">${escapedText}</text>
    `;
  } else {
    textElement = `
      <text x="${x}" y="${y}"
        font-family="'${fontFamily}'"
        font-size="${effectiveFontSize}"
        text-anchor="${textAnchor}"
        letter-spacing="${letterSpacing}"
        fill="${style.color}"
        ${filterAttr}>${escapedText}</text>
    `;
  }

  return `
    <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          ${fontFace}
        </style>
        ${filterDef}
      </defs>
      ${textElement}
    </svg>
  `;
}

/**
 * Estimate text width for auto-sizing.
 *
 * Note: This is a rough approximation using 0.6 * fontSize as average character width.
 * This works reasonably well for most Latin fonts but may be inaccurate for:
 * - Monospace fonts (where all chars are same width)
 * - Condensed or extended font variants
 * - Text with many narrow (i, l) or wide (m, w) characters
 *
 * For more accurate width calculation, font metrics would need to be loaded,
 * which is a potential future enhancement.
 */
function estimateTextWidth(text: string, fontSize: number, letterSpacing: number): number {
  const avgCharWidth = fontSize * 0.6;
  const totalLetterSpacing = (text.length - 1) * letterSpacing;
  return text.length * avgCharWidth + totalLetterSpacing;
}

/**
 * Calculate font size to fit text within maxWidth
 */
function calculateFittedFontSize(
  text: string,
  style: TextStyle,
  maxWidth: number
): number {
  const letterSpacing = style.letterSpacing ?? 0;
  let fontSize = style.fontSize;

  // Reduce font size until text fits
  while (fontSize > MIN_FONT_SIZE) {
    const estimatedWidth = estimateTextWidth(text, fontSize, letterSpacing);
    if (estimatedWidth <= maxWidth) {
      break;
    }
    fontSize -= 1;
  }

  if (fontSize < style.fontSize) {
    logger.debug('Font size reduced to fit maxWidth', {
      original: style.fontSize,
      fitted: fontSize,
      maxWidth,
    });
  }

  return fontSize;
}

/**
 * Add text overlays to an image.
 *
 * @param options - Configuration including image and text layers
 * @returns Sharp instance with text rendered
 * @throws {InvalidInputError} When input validation fails
 * @throws {ImageProcessingError} When Sharp operation fails
 *
 * @example
 * ```typescript
 * import { addText, createCanvas, initBundledFonts } from '@bjj-poster/core';
 *
 * await initBundledFonts();
 *
 * const canvas = await createCanvas({
 *   width: 1080,
 *   height: 1350,
 *   fill: { type: 'solid', color: '#1a1a1a' },
 * });
 *
 * const result = await addText({
 *   image: canvas,
 *   layers: [
 *     {
 *       content: 'JOHN DOE',
 *       position: 'center',
 *       style: {
 *         fontFamily: 'Oswald-Bold',
 *         fontSize: 64,
 *         color: '#ffffff',
 *         align: 'center',
 *         textTransform: 'uppercase',
 *       },
 *     },
 *   ],
 * });
 *
 * const buffer = await result.png().toBuffer();
 * ```
 */
export async function addText(options: AddTextOptions): Promise<Sharp> {
  const { image, layers, strictFont = false } = options;

  if (!layers || layers.length === 0) {
    // No text to add, return image as-is
    const buffer = Buffer.isBuffer(image) ? image : await image.png().toBuffer();
    return sharp(buffer);
  }

  logger.debug('addText started', { layerCount: layers.length });

  try {
    // Get image buffer and dimensions
    const imageBuffer = Buffer.isBuffer(image) ? image : await image.png().toBuffer();
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new InvalidInputError('Unable to read image dimensions');
    }

    const canvasWidth = metadata.width;
    const canvasHeight = metadata.height;

    // Process each text layer
    const compositeInputs: Array<{ input: Buffer; top: number; left: number }> = [];

    for (const layer of layers) {
      // Validate style
      validateStyle(layer.style);

      // Get font data if registered, otherwise handle based on strictFont option
      const fontData = getFont(layer.style.fontFamily);
      if (!fontData) {
        if (strictFont) {
          throw new InvalidInputError(
            `Font '${layer.style.fontFamily}' is not registered. ` +
              `Register it with registerFont() or initBundledFonts() before use.`
          );
        }
        logger.warn('Font not registered, using fallback', {
          requestedFont: layer.style.fontFamily,
          fallbackFont: getDefaultFont(),
        });
      }

      // Apply text transform for width calculation
      const transformedText = applyTextTransform(layer.content, layer.style.textTransform);

      // Calculate effective font size (may be reduced for maxWidth)
      let effectiveFontSize = layer.style.fontSize;
      if (layer.style.maxWidth) {
        effectiveFontSize = calculateFittedFontSize(
          transformedText,
          layer.style,
          layer.style.maxWidth
        );
      }

      // Generate SVG for this text layer
      const svg = buildTextSvg(layer, canvasWidth, canvasHeight, fontData, effectiveFontSize);

      compositeInputs.push({
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      });
    }

    // Composite all text layers onto the image
    const result = await sharp(imageBuffer).composite(compositeInputs).png().toBuffer();

    logger.debug('addText completed', { layerCount: layers.length });

    return sharp(result);
  } catch (error) {
    // Re-throw domain errors as-is
    if (error instanceof InvalidInputError) {
      throw error;
    }

    // Let programming errors (TypeError, ReferenceError, etc.) propagate unwrapped
    // so they're not hidden behind ImageProcessingError
    if (
      error instanceof TypeError ||
      error instanceof ReferenceError ||
      error instanceof RangeError ||
      error instanceof SyntaxError
    ) {
      throw error;
    }

    logger.error('addText failed', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new ImageProcessingError(
      `Failed to add text: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
