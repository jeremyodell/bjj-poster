export { loadImage, getImageMetadata } from './loader.js';
export { createCanvas } from './canvas.js';
export { compositeImage } from './composite.js';
export { addText } from './text.js';
export {
  registerFont,
  getFont,
  isFontRegistered,
  listFonts,
  getDefaultFont,
  initBundledFonts,
  listBundledFonts,
  clearFonts,
} from './fonts.js';
export type { InitBundledFontsResult } from './fonts.js';
export { ImageProcessingError, InvalidInputError, FontLoadError } from './errors.js';
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
  TextAlign,
  TextTransform,
  TextStroke,
  TextStyle,
  TextLayer,
  AddTextOptions,
} from './types.js';
export type { RgbColor, RgbaColor } from './color-utils.js';
export type { CompositeLayer, CompositeOptions } from './composite.js';
