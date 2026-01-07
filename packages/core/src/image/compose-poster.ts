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
