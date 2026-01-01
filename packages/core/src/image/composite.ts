import sharp, { Sharp } from 'sharp';
import { logger } from '../logger.js';
import { ImageProcessingError, InvalidInputError } from './errors.js';
import { isValidHexColor, parseRgbaColor, parseColor } from './color-utils.js';
import type { MaskShape, Position, Border, Shadow, LayerSize } from './types.js';


export interface CompositeLayer {
  image: Sharp | Buffer;
  position: Position;
  size?: LayerSize;
  mask?: MaskShape;
  border?: Border;
  shadow?: Shadow;
  opacity?: number; // 0-1
}


export interface CompositeOptions {
  background: Sharp;
  layers: CompositeLayer[]; // images to place on top
}

const MAX_DIMENSION = 10000; // prevents memory exhaustion
const MAX_BLUR = 100;
const MAX_BORDER_WIDTH = 200;

function validateDimensions(width: number, height: number, context: string): void {
  if (width <= 0 || height <= 0) {
    throw new InvalidInputError(`${context}: dimensions must be positive (got ${width}x${height})`);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new InvalidInputError(
      `${context}: dimensions exceed maximum of ${MAX_DIMENSION}px (got ${width}x${height})`
    );
  }
}

// safely get width and height from Sharp's metadata
function getDimensions(
  metadata: { width?: number; height?: number },
  context: string
): { width: number; height: number } {
  if (metadata.width === undefined || metadata.height === undefined) {
    throw new InvalidInputError(`${context}: unable to read image dimensions`);
  }
  return { width: metadata.width, height: metadata.height };
}

// converts named positions (center, top-center, etc) to x & y coordinates
function calculatePosition(
  position: Position,
  canvasWidth: number,
  canvasHeight: number,
  layerWidth: number,
  layerHeight: number
): { x: number; y: number } {
  if (typeof position === 'object' && 'x' in position) {
    return { x: position.x, y: position.y };
  }

  switch (position) {
    case 'center':
      return {
        x: Math.round((canvasWidth - layerWidth) / 2),
        y: Math.round((canvasHeight - layerHeight) / 2),
      };
    case 'top-center':
      return {
        x: Math.round((canvasWidth - layerWidth) / 2),
        y: 0,
      };
    case 'bottom-center':
      return {
        x: Math.round((canvasWidth - layerWidth) / 2),
        y: canvasHeight - layerHeight,
      };
    case 'left-center':
      return {
        x: 0,
        y: Math.round((canvasHeight - layerHeight) / 2),
      };
    case 'right-center':
      return {
        x: canvasWidth - layerWidth,
        y: Math.round((canvasHeight - layerHeight) / 2),
      };
    default:
      throw new InvalidInputError(`Unknown position: ${position}`);
  }
}

// resize image maintaining aspect ratio so photo does not become stretched/squished or deformed in any way
async function resizeImage(
  imageBuffer: Buffer,
  size: { width?: number; height?: number }
): Promise<Buffer> {
  // validate size input
  if (size.width !== undefined && size.width <= 0) {
    throw new InvalidInputError(`Resize width must be positive, got: ${size.width}`);
  }
  if (size.height !== undefined && size.height <= 0) {
    throw new InvalidInputError(`Resize height must be positive, got: ${size.height}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width: originalWidth, height: originalHeight } = getDimensions(metadata, 'Resize source');

  let targetWidth = size.width;
  let targetHeight = size.height;

  // calculate the missing dimension while maintaining aspect ratio
  if (targetWidth && !targetHeight) {
    targetHeight = Math.round((originalHeight / originalWidth) * targetWidth);
  } else if (targetHeight && !targetWidth) {
    targetWidth = Math.round((originalWidth / originalHeight) * targetHeight);
  }

  // ensure valid target dimensions
  if (!targetWidth || !targetHeight) {
    throw new InvalidInputError('Resize requires at least width or height to be specified');
  }

  validateDimensions(targetWidth, targetHeight, 'Resize target');

  // logs warning if scaling up
  if (targetWidth > originalWidth || targetHeight > originalHeight) {
    logger.warn('Scaling up image may reduce quality', {
      originalWidth,
      originalHeight,
      targetWidth,
      targetHeight,
    });
  }

  return sharp(imageBuffer)
    .resize(targetWidth, targetHeight, { fit: 'fill' })
    .toBuffer();
}

// use Sharp library to crop image to a circle shape
async function applyCircleMask(imageBuffer: Buffer): Promise<Buffer> {
  // get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Circle mask');

  // calculate circular parameters
  const radius = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;

  // create SVG mask
  const circleSvg = `<svg width="${width}" height="${height}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="white"/>
  </svg>`;

  return sharp(imageBuffer)
    .ensureAlpha() // png needs alpha channel/transparency, but jpeg doesn't have one so must be added
    .composite([
      {
        input: Buffer.from(circleSvg),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

// apply a rounded rectangle mask to an image
async function applyRoundedRectMask(imageBuffer: Buffer, radius: number): Promise<Buffer> {
  if (radius < 0) {
    throw new InvalidInputError(`Rounded rect radius must be non-negative, got: ${radius}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Rounded rect mask');

  // clamp radius to half of the smallest dimension
  const effectiveRadius = Math.min(radius, width / 2, height / 2);

  const roundedRectSvg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${effectiveRadius}" ry="${effectiveRadius}" fill="white"/>
  </svg>`;

  return sharp(imageBuffer)
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from(roundedRectSvg),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

// apply mask to image based on mask shape
async function applyMask(imageBuffer: Buffer, mask: MaskShape): Promise<Buffer> {
  if (mask.type === 'none') {
    return imageBuffer;
  }

  if (mask.type === 'circle') {
    return applyCircleMask(imageBuffer);
  }

  if (mask.type === 'rounded-rect') {
    return applyRoundedRectMask(imageBuffer, mask.radius);
  }

  throw new InvalidInputError(`Unknown mask type: ${(mask as MaskShape).type}`);
}

async function addBorder(
  imageBuffer: Buffer,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
  if (borderWidth < 0) {
    throw new InvalidInputError(`Border width must be non-negative, got: ${borderWidth}`);
  }
  if (borderWidth > MAX_BORDER_WIDTH) {
    throw new InvalidInputError(`Border width exceeds maximum of ${MAX_BORDER_WIDTH}px, got: ${borderWidth}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Border source');
  const newWidth = width + borderWidth * 2;
  const newHeight = height + borderWidth * 2;

  validateDimensions(newWidth, newHeight, 'Border result');

  const color = parseColor(borderColor);

  // create a canvas with the border color
  const borderCanvas = sharp({
    create: {
      width: newWidth,
      height: newHeight,
      channels: 4,
      background: { r: color.r, g: color.g, b: color.b, alpha: color.alpha },
    },
  });

  // composite the image on top, centered
  return borderCanvas
    .composite([
      {
        input: imageBuffer,
        left: borderWidth,
        top: borderWidth,
      },
    ])
    .png()
    .toBuffer();
}

// add a border that follows a circular shape
async function addCircleBorder(
  imageBuffer: Buffer,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
  if (borderWidth < 0) {
    throw new InvalidInputError(`Border width must be non-negative, got: ${borderWidth}`);
  }
  if (borderWidth > MAX_BORDER_WIDTH) {
    throw new InvalidInputError(`Border width exceeds maximum of ${MAX_BORDER_WIDTH}px, got: ${borderWidth}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Circle border source');
  const newWidth = width + borderWidth * 2;
  const newHeight = height + borderWidth * 2;

  validateDimensions(newWidth, newHeight, 'Circle border result');

  const color = parseColor(borderColor);
  const colorStr = `rgba(${color.r},${color.g},${color.b},${color.alpha})`;

  // create SVG with a circle border
  const radius = Math.min(newWidth, newHeight) / 2;
  const cx = newWidth / 2;
  const cy = newHeight / 2;

  const borderSvg = `<svg width="${newWidth}" height="${newHeight}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${colorStr}"/>
  </svg>`;

  return sharp(Buffer.from(borderSvg))
    .composite([
      {
        input: imageBuffer,
        left: borderWidth,
        top: borderWidth,
      },
    ])
    .png()
    .toBuffer();
}

// add a border that follows a rounded rectangle shape
async function addRoundedRectBorder(
  imageBuffer: Buffer,
  borderWidth: number,
  borderColor: string,
  cornerRadius: number
): Promise<Buffer> {
  if (borderWidth < 0) {
    throw new InvalidInputError(`Border width must be non-negative, got: ${borderWidth}`);
  }
  if (borderWidth > MAX_BORDER_WIDTH) {
    throw new InvalidInputError(`Border width exceeds maximum of ${MAX_BORDER_WIDTH}px, got: ${borderWidth}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Rounded rect border source');
  const newWidth = width + borderWidth * 2;
  const newHeight = height + borderWidth * 2;

  validateDimensions(newWidth, newHeight, 'Rounded rect border result');

  const color = parseColor(borderColor);
  const colorStr = `rgba(${color.r},${color.g},${color.b},${color.alpha})`;

  // outer radius must account for the border width
  const outerRadius = cornerRadius + borderWidth;

  const borderSvg = `<svg width="${newWidth}" height="${newHeight}">
    <rect x="0" y="0" width="${newWidth}" height="${newHeight}" rx="${outerRadius}" ry="${outerRadius}" fill="${colorStr}"/>
  </svg>`;

  return sharp(Buffer.from(borderSvg))
    .composite([
      {
        input: imageBuffer,
        left: borderWidth,
        top: borderWidth,
      },
    ])
    .png()
    .toBuffer();
}

// create a soft drop shadow behind an image
async function createShadow(
  imageBuffer: Buffer,
  shadow: { blur: number; offsetX: number; offsetY: number; color: string }
): Promise<{ buffer: Buffer; offsetX: number; offsetY: number; width: number; height: number }> {
  if (shadow.blur < 0) {
    throw new InvalidInputError(`Shadow blur must be non-negative, got: ${shadow.blur}`);
  }
  if (shadow.blur > MAX_BLUR) {
    throw new InvalidInputError(`Shadow blur exceeds maximum of ${MAX_BLUR}, got: ${shadow.blur}`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Shadow source');

  // calculate canvas size to accommodate shadow offset and blur
  const padding = shadow.blur * 2;
  const totalOffsetX = Math.abs(shadow.offsetX) + padding;
  const totalOffsetY = Math.abs(shadow.offsetY) + padding;
  const canvasWidth = width + totalOffsetX * 2;
  const canvasHeight = height + totalOffsetY * 2;

  validateDimensions(canvasWidth, canvasHeight, 'Shadow canvas');

  // Parse shadow color
  const color = parseColor(shadow.color);

  // Create a shadow by using the image with tint and blur
  // First ensure we have an alpha channel, then extract it for masking
  const imageWithAlpha = await sharp(imageBuffer).ensureAlpha().png().toBuffer();

  // Create the shadow color layer
  const shadowColorSvg = `<svg width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="rgba(${color.r},${color.g},${color.b},${color.alpha})"/>
  </svg>`;

  // Create the colored shadow by compositing shadow color with the image alpha
  const coloredShadow = await sharp(Buffer.from(shadowColorSvg))
    .composite([
      {
        input: imageWithAlpha,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  // Apply blur to create the shadow effect
  const blurredShadow = await sharp(coloredShadow)
    .blur(shadow.blur > 0 ? shadow.blur : 0.3)
    .toBuffer();

  // Create the final canvas with shadow and image
  const imageX = totalOffsetX;
  const imageY = totalOffsetY;
  const shadowX = totalOffsetX + shadow.offsetX;
  const shadowY = totalOffsetY + shadow.offsetY;

  const result = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: blurredShadow,
        left: shadowX,
        top: shadowY,
      },
      {
        input: imageBuffer,
        left: imageX,
        top: imageY,
      },
    ])
    .png()
    .toBuffer();

  return {
    buffer: result,
    offsetX: totalOffsetX,
    offsetY: totalOffsetY,
    width: canvasWidth,
    height: canvasHeight,
  };
}

async function applyOpacity(imageBuffer: Buffer, opacity: number): Promise<Buffer> {
  if (opacity < 0 || opacity > 1) {
    throw new InvalidInputError(`Opacity must be between 0 and 1, got: ${opacity}`);
  }

  if (opacity === 1) {
    return imageBuffer;
  }

  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = getDimensions(metadata, 'Opacity source');

  // create an alpha mask with the desired opacity
  const alphaMask = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: opacity },
    },
  })
    .png()
    .toBuffer();

  return sharp(imageBuffer)
    .ensureAlpha()
    .composite([
      {
        input: alphaMask,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

// Process a single layer and prepare it for compositing
async function processLayer(
  layer: CompositeLayer,
  canvasWidth: number,
  canvasHeight: number
): Promise<{ input: Buffer; left: number; top: number }> {
  // Get the image buffer
  let imageBuffer: Buffer;
  if (Buffer.isBuffer(layer.image)) {
    imageBuffer = layer.image;
  } else {
    imageBuffer = await layer.image.toBuffer();
  }

  // Resize if needed
  if (layer.size) {
    imageBuffer = await resizeImage(imageBuffer, layer.size);
  }

  // Apply mask if specified
  if (layer.mask && layer.mask.type !== 'none') {
    imageBuffer = await applyMask(imageBuffer, layer.mask);
  }

  // Add border if specified (must be after mask so border follows mask shape)
  if (layer.border) {
    if (!isValidHexColor(layer.border.color)) {
      throw new InvalidInputError(
        `Invalid border color: ${layer.border.color}. Expected format: #rrggbb`
      );
    }

    // Use shape-aware border if mask is applied
    if (layer.mask?.type === 'circle') {
      imageBuffer = await addCircleBorder(imageBuffer, layer.border.width, layer.border.color);
    } else if (layer.mask?.type === 'rounded-rect') {
      imageBuffer = await addRoundedRectBorder(
        imageBuffer,
        layer.border.width,
        layer.border.color,
        layer.mask.radius
      );
    } else {
      imageBuffer = await addBorder(imageBuffer, layer.border.width, layer.border.color);
    }
  }

  // Get current dimensions after resize and border
  const layerMeta = await sharp(imageBuffer).metadata();
  let { width: layerWidth, height: layerHeight } = getDimensions(layerMeta, 'Layer');

  // Calculate position offset for shadow (will be adjusted if shadow is added)
  let shadowOffsetX = 0;
  let shadowOffsetY = 0;

  // Add shadow if specified (before position calculation since it changes dimensions)
  if (layer.shadow) {
    const rgba = parseRgbaColor(layer.shadow.color);
    if (!rgba && !isValidHexColor(layer.shadow.color)) {
      throw new InvalidInputError(
        `Invalid shadow color: ${layer.shadow.color}. Expected format: #rrggbb or rgba(r,g,b,a)`
      );
    }

    const shadowResult = await createShadow(imageBuffer, layer.shadow);
    imageBuffer = shadowResult.buffer;
    shadowOffsetX = shadowResult.offsetX;
    shadowOffsetY = shadowResult.offsetY;
    layerWidth = shadowResult.width;
    layerHeight = shadowResult.height;
  }

  // Apply opacity if specified
  if (layer.opacity !== undefined && layer.opacity !== 1) {
    imageBuffer = await applyOpacity(imageBuffer, layer.opacity);
  }

  // Calculate position
  const pos = calculatePosition(layer.position, canvasWidth, canvasHeight, layerWidth, layerHeight);

  // Adjust position for shadow offset (the image inside the shadow canvas is offset)
  const left = pos.x - shadowOffsetX + (layer.shadow?.offsetX ?? 0);
  const top = pos.y - shadowOffsetY + (layer.shadow?.offsetY ?? 0);

  return { input: imageBuffer, left, top };
}

/**
 * Composite multiple layers onto a background.
 *
 * @param options - Configuration including background and layers
 * @returns Sharp instance of the composited image
 * @throws {InvalidInputError} When input validation fails
 * @throws {ImageProcessingError} When Sharp operation fails
 *
 * @example
 * ```typescript
 * const result = await compositeImage({
 *   background: await createCanvas({ width: 1080, height: 1350, fill: { type: 'solid', color: '#1a1a1a' } }),
 *   layers: [{
 *     image: athletePhotoBuffer,
 *     position: 'center',
 *     size: { width: 400 },
 *     mask: { type: 'circle' },
 *     border: { width: 4, color: '#ffd700' },
 *     shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
 *   }],
 * });
 * const buffer = await result.png().toBuffer();
 * ```
 */
export async function compositeImage(options: CompositeOptions): Promise<Sharp> {
  const { background, layers } = options;

  if (!layers || layers.length === 0) {
    const buffer = await background.png().toBuffer();
    return sharp(buffer);
  }

  try {
    // Get background dimensions
    const bgBuffer = await background.png().toBuffer();
    const bgMetadata = await sharp(bgBuffer).metadata();
    const { width: canvasWidth, height: canvasHeight } = getDimensions(bgMetadata, 'Background');
    validateDimensions(canvasWidth, canvasHeight, 'Background');

    // Process all layers
    const compositeInputs: Array<{ input: Buffer; left: number; top: number }> = [];

    for (const layer of layers) {
      const processed = await processLayer(layer, canvasWidth, canvasHeight);
      compositeInputs.push(processed);
    }

    // Composite all layers onto background
    const result = await sharp(bgBuffer).composite(compositeInputs).png().toBuffer();

    return sharp(result);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }

    throw new ImageProcessingError(
      `Failed to composite image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
