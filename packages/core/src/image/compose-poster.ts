/**
 * Output format options for composed poster
 */
export interface OutputOptions {
  /** Output format (default: 'png') */
  format?: 'png' | 'jpeg';
  /** JPEG quality 1-100 (default: 85) */
  quality?: number;
  /** Resize the output */
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
}

/**
 * Options for composing a poster
 */
export interface ComposePosterOptions {
  /** Template ID to use (e.g., 'classic', 'modern') */
  templateId: string;
  /** Athlete photo as Buffer */
  athletePhoto: Buffer;
  /** Data keyed by template field IDs */
  data: Record<string, string>;
  /** Output format options */
  output?: OutputOptions;
  /** Progress callback */
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Result from composing a poster
 */
export interface ComposePosterResult {
  /** The composed image buffer */
  buffer: Buffer;
  /** Image metadata */
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Progress stages for poster composition
 */
export const COMPOSE_STAGES = {
  LOADING_TEMPLATE: { name: 'loading-template', percent: 0 },
  CREATING_BACKGROUND: { name: 'creating-background', percent: 10 },
  PROCESSING_PHOTO: { name: 'processing-photo', percent: 30 },
  COMPOSITING_PHOTO: { name: 'compositing-photo', percent: 50 },
  RENDERING_TEXT: { name: 'rendering-text', percent: 70 },
  ENCODING_OUTPUT: { name: 'encoding-output', percent: 90 },
} as const;

import sharp from 'sharp';
import { loadTemplate } from '../templates/index.js';
import { InvalidInputError } from './errors.js';
import type { PosterTemplate } from '../templates/types.js';

/**
 * Validate that all required template fields have data
 */
function validateTemplateData(template: PosterTemplate, data: Record<string, string>): void {
  const missingFields: string[] = [];

  for (const textField of template.text) {
    if (!(textField.id in data) || data[textField.id] === undefined || data[textField.id] === '') {
      missingFields.push(textField.id);
    }
  }

  if (missingFields.length > 0) {
    throw new InvalidInputError(`Missing required data fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validate that the photo buffer is a valid image
 */
async function validatePhoto(photo: Buffer): Promise<void> {
  try {
    const metadata = await sharp(photo).metadata();
    if (!metadata.width || !metadata.height) {
      throw new InvalidInputError('Photo buffer is not a valid image');
    }
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }
    throw new InvalidInputError(
      `Invalid photo: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Compose a complete poster from template, photo, and data.
 *
 * @param options - Composition options
 * @returns The composed poster buffer and metadata
 * @throws {TemplateNotFoundError} If template doesn't exist
 * @throws {InvalidInputError} If validation fails
 * @throws {ImageProcessingError} If image processing fails
 */
export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult> {
  const { templateId, athletePhoto, data, onProgress } = options;

  // Stage: loading-template
  onProgress?.(COMPOSE_STAGES.LOADING_TEMPLATE.name, COMPOSE_STAGES.LOADING_TEMPLATE.percent);

  // Load and validate template
  const template = loadTemplate(templateId);

  // Validate data fields
  validateTemplateData(template, data);

  // Validate photo
  await validatePhoto(athletePhoto);

  // TODO: Implement remaining stages
  throw new Error('Not yet implemented');
}
