import sharp, { Sharp } from 'sharp';
import { ImageProcessingError, InvalidInputError } from './errors.js';
import type { ImageMetadata } from './types.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Check if a string is a URL
 */
function isUrl(source: string): boolean {
  return source.startsWith('http://') || source.startsWith('https://');
}

/**
 * Validate URL is safe to fetch (SSRF protection)
 */
function validateUrl(url: string): void {
  const parsed = new URL(url);

  const blockedHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (blockedHostnames.includes(parsed.hostname)) {
    throw new InvalidInputError('URL points to a blocked host');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new InvalidInputError('Only HTTP and HTTPS URLs are allowed');
  }
}

/**
 * Fetch image from URL with timeout and size limits
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  validateUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new ImageProcessingError(
        `Failed to fetch image: HTTP ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      throw new InvalidInputError(
        `Invalid content type: expected image/*, got ${contentType}`
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      throw new InvalidInputError(
        `Image too large: ${contentLength} bytes exceeds ${MAX_IMAGE_SIZE} byte limit`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      throw new InvalidInputError(
        `Image too large: ${arrayBuffer.byteLength} bytes exceeds ${MAX_IMAGE_SIZE} byte limit`
      );
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof ImageProcessingError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ImageProcessingError(`Request timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw new ImageProcessingError(
      `Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Load an image from various sources.
 *
 * @param source - File path, URL, or Buffer
 * @returns Sharp instance for further processing
 *
 * @example
 * ```typescript
 * const image = await loadImage('/path/to/image.png');
 * const image = await loadImage(buffer);
 * const image = await loadImage('https://example.com/image.png');
 * ```
 */
export async function loadImage(source: string | Buffer): Promise<Sharp> {
  try {
    let input: Buffer | string;

    if (Buffer.isBuffer(source)) {
      input = source;
    } else if (isUrl(source)) {
      input = await fetchImageBuffer(source);
    } else {
      input = source;
    }

    const image = sharp(input);
    await image.metadata(); // Validate the image
    return sharp(input);
  } catch (error) {
    if (error instanceof ImageProcessingError || error instanceof InvalidInputError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('Input file is missing')) {
        throw new InvalidInputError(`Image file not found: ${source}`);
      }
      if (error.message.includes('unsupported image format')) {
        throw new InvalidInputError('Invalid or unsupported image format');
      }
      throw new ImageProcessingError(`Failed to load image: ${error.message}`);
    }

    throw new ImageProcessingError('Failed to load image: Unknown error');
  }
}

/**
 * Get metadata about an image.
 *
 * @param source - File path, URL, or Buffer
 * @returns Image dimensions and format
 *
 * @example
 * ```typescript
 * const { width, height, format } = await getImageMetadata('/path/to/image.png');
 * ```
 */
export async function getImageMetadata(source: string | Buffer): Promise<ImageMetadata> {
  const image = await loadImage(source);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new InvalidInputError('Unable to extract image metadata');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}
