import { AppError } from '../errors.js';

/**
 * Thrown when image processing fails
 */
export class ImageProcessingError extends AppError {
  constructor(message: string) {
    super(message, 500, 'IMAGE_PROCESSING_ERROR');
    this.name = 'ImageProcessingError';
  }
}

/**
 * Thrown when image input is invalid or corrupt
 */
export class InvalidInputError extends AppError {
  constructor(message: string) {
    super(message, 400, 'INVALID_IMAGE_INPUT');
    this.name = 'InvalidInputError';
  }
}

/**
 * Thrown when a font cannot be loaded
 */
export class FontLoadError extends AppError {
  constructor(fontName: string, reason?: string) {
    const message = reason
      ? `Failed to load font '${fontName}': ${reason}`
      : `Failed to load font '${fontName}'`;
    super(message, 500, 'FONT_LOAD_ERROR');
    this.name = 'FontLoadError';
  }
}
