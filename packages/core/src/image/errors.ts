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
