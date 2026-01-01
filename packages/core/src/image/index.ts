export { loadImage, getImageMetadata } from './loader.js';
export { createCanvas } from './canvas.js';
export { compositeImage } from './composite.js';
export { ImageProcessingError, InvalidInputError } from './errors.js';
export {
  isValidHexColor,
  hexToRgb,
  hexToRgba,
  parseRgbaColor,
  parseColor,
} from './color-utils.js';
export type {
  ImageMetadata,
  GradientDirection,
  GradientStop,
  CanvasFill,
  CanvasOptions,
  Position,
  MaskShape,
  Border,
  Shadow,
  LayerSize,
} from './types.js';
export type { RgbColor, RgbaColor } from './color-utils.js';
export type { CompositeLayer, CompositeOptions } from './composite.js';
