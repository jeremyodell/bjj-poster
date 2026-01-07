import type { MaskShape, GradientDirection, GradientStop, TextStyle } from '../image/types.js';

/**
 * Position using anchor + offset for intuitive layout
 */
export interface TemplatePosition {
  anchor:
    | 'center'
    | 'top-center'
    | 'bottom-center'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  offsetX: number;
  offsetY: number;
}

/**
 * Text field definition in a template
 */
export interface TemplateTextField {
  /** Field identifier for data binding (e.g., "athleteName") */
  id: string;
  /** Position on the canvas */
  position: TemplatePosition;
  /** Text styling */
  style: TextStyle;
  /** Placeholder text shown in previews */
  placeholder?: string;
}

/**
 * Photo field definition in a template
 */
export interface TemplatePhotoField {
  /** Field identifier for data binding (e.g., "athletePhoto") */
  id: string;
  /** Position on the canvas */
  position: TemplatePosition;
  /** Photo dimensions */
  size: { width: number; height: number };
  /** Optional mask shape */
  mask?: MaskShape;
  /** Optional border */
  border?: { width: number; color: string };
  /** Optional drop shadow */
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
}

/**
 * Background configuration for a template
 */
export type TemplateBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] }
  | { type: 'image'; path: string };

/**
 * Complete poster template definition
 */
export interface PosterTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Semantic version */
  version: string;
  /** Canvas dimensions */
  canvas: { width: number; height: number };
  /** Background configuration */
  background: TemplateBackground;
  /** Photo field definitions */
  photos: TemplatePhotoField[];
  /** Text field definitions */
  text: TemplateTextField[];
}
