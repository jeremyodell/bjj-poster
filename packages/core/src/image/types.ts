/**
 * Image metadata returned from analysis
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

/**
 * Position can be pixel coordinates or named anchor
 */
export type Position =
  | { x: number; y: number }
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';

/**
 * Shape mask for images
 */
export type MaskShape =
  | { type: 'none' }
  | { type: 'circle' }
  | { type: 'rounded-rect'; radius: number };

/**
 * Gradient direction for backgrounds
 */
export type GradientDirection = 'to-bottom' | 'to-right' | 'to-bottom-right' | 'radial';

/**
 * Gradient color stop
 */
export interface GradientStop {
  /** Hex color (e.g., #ff5733) */
  color: string;
  /** Position as percentage (0-100) */
  position: number;
}

/**
 * Fill options for canvas creation
 */
export type CanvasFill =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] };

/**
 * Options for creating a canvas
 */
export interface CanvasOptions {
  width: number;
  height: number;
  fill: CanvasFill;
}

/**
 * Border configuration for composite layers
 */
export interface Border {
  /** Border width in pixels (0-200) */
  width: number;
  /** Border color as hex (#rrggbb) */
  color: string;
}

/**
 * Shadow configuration for composite layers
 */
export interface Shadow {
  /** Blur radius in pixels (0-100) */
  blur: number;
  /** Horizontal offset in pixels */
  offsetX: number;
  /** Vertical offset in pixels */
  offsetY: number;
  /** Shadow color as hex (#rrggbb) or rgba() */
  color: string;
}

/**
 * Size specification for image resizing.
 * At least one dimension must be specified.
 */
export type LayerSize =
  | { width: number; height?: number }
  | { height: number; width?: number };

/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Text transform options
 */
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

/**
 * Stroke/outline configuration for text
 */
export interface TextStroke {
  /** Stroke width in pixels */
  width: number;
  /** Stroke color as hex (#rrggbb) */
  color: string;
}

/**
 * Style configuration for text rendering
 */
export interface TextStyle {
  /** Font family name (must be registered via registerFont or initBundledFonts) */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Text color as hex (#rrggbb) */
  color: string;
  /** Text alignment (default: 'left') */
  align?: TextAlign;
  /** Letter spacing in pixels (default: 0) */
  letterSpacing?: number;
  /** Text transform (default: 'none') */
  textTransform?: TextTransform;
  /** Stroke/outline effect */
  stroke?: TextStroke;
  /** Drop shadow effect */
  shadow?: Shadow;
  /** Maximum width - font will shrink to fit if text exceeds this width */
  maxWidth?: number;
}

/**
 * A single text layer to render
 */
export interface TextLayer {
  /** The text content to render */
  content: string;
  /** Position on the canvas */
  position: Position;
  /** Text styling options */
  style: TextStyle;
}

/**
 * Options for the addText function
 */
export interface AddTextOptions {
  /** The image to add text to (Sharp instance or Buffer) */
  image: import('sharp').Sharp | Buffer;
  /** Text layers to render */
  layers: TextLayer[];
  /**
   * If true, throws InvalidInputError when a requested font is not registered.
   * If false (default), falls back to system font with a warning.
   */
  strictFont?: boolean;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Background configuration for a template.
 * Supports solid colors, gradients, or image files.
 */
export type TemplateBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] }
  | { type: 'image'; path: string };

/**
 * A photo field in a template (e.g., athlete photo).
 */
export interface TemplatePhotoField {
  /** Unique identifier for data binding (e.g., "athletePhoto") */
  id: string;
  /** Position on the canvas */
  position: Position;
  /** Target size for the photo */
  size: { width: number; height: number };
  /** Optional mask shape */
  mask?: MaskShape;
  /** Optional border */
  border?: Border;
  /** Optional drop shadow */
  shadow?: Shadow;
}

/**
 * A text field in a template with placeholder and styling.
 */
export interface TemplateTextField {
  /** Unique identifier for data binding (e.g., "athleteName", "tournament") */
  id: string;
  /** Position on the canvas */
  position: Position;
  /** Text styling options */
  style: TextStyle;
  /** Placeholder text shown in previews */
  placeholder?: string;
}

/**
 * Complete poster template configuration.
 */
export interface PosterTemplate {
  /** Unique template identifier */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Template description */
  description: string;
  /** Semantic version of the template */
  version: string;

  /** Canvas dimensions */
  canvas: {
    width: number;
    height: number;
  };

  /** Background configuration */
  background: TemplateBackground;

  /** Photo fields in the template */
  photos: TemplatePhotoField[];

  /** Text fields in the template */
  text: TemplateTextField[];
}
