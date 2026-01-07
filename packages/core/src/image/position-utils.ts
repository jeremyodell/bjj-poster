import type { TemplatePosition } from '../templates/types.js';

interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Convert template anchor+offset position to absolute x/y coordinates.
 *
 * @param templatePos - Position with anchor and offsets from template
 * @param canvas - Canvas dimensions
 * @returns Absolute x/y coordinates
 *
 * @example
 * ```typescript
 * const pos = convertTemplatePosition(
 *   { anchor: 'center', offsetX: 0, offsetY: -100 },
 *   { width: 1080, height: 1350 }
 * );
 * // Returns { x: 540, y: 575 }
 * ```
 */
export function convertTemplatePosition(
  templatePos: TemplatePosition,
  canvas: CanvasSize
): { x: number; y: number } {
  const { anchor, offsetX, offsetY } = templatePos;

  let baseX: number;
  let baseY: number;

  switch (anchor) {
    case 'center':
      baseX = canvas.width / 2;
      baseY = canvas.height / 2;
      break;
    case 'top-center':
      baseX = canvas.width / 2;
      baseY = 0;
      break;
    case 'bottom-center':
      baseX = canvas.width / 2;
      baseY = canvas.height;
      break;
    case 'top-left':
      baseX = 0;
      baseY = 0;
      break;
    case 'top-right':
      baseX = canvas.width;
      baseY = 0;
      break;
    case 'bottom-left':
      baseX = 0;
      baseY = canvas.height;
      break;
    case 'bottom-right':
      baseX = canvas.width;
      baseY = canvas.height;
      break;
  }

  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
  };
}
