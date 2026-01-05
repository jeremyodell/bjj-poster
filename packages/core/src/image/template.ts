import { TemplateNotFoundError, TemplateValidationError } from './errors.js';
import { isValidHexColor, parseRgbaColor } from './color-utils.js';
import type { PosterTemplate, Position, MaskShape, GradientStop } from './types.js';

// ============================================================================
// Template Registry
// ============================================================================

const templateRegistry = new Map<string, PosterTemplate>();

/**
 * Validate a color string that can be either hex (#rrggbb) or rgba(r,g,b,a) format.
 */
function isValidColor(color: string): boolean {
  return isValidHexColor(color) || parseRgbaColor(color) !== null;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const MAX_DIMENSION = 10000;
const MIN_DIMENSION = 1;
const MAX_FONT_SIZE = 500;
const MIN_FONT_SIZE = 1;

function isValidPosition(position: unknown): position is Position {
  if (typeof position === 'string') {
    return ['center', 'top-center', 'bottom-center', 'left-center', 'right-center'].includes(
      position
    );
  }
  if (typeof position === 'object' && position !== null) {
    const pos = position as Record<string, unknown>;
    return typeof pos.x === 'number' && typeof pos.y === 'number';
  }
  return false;
}

function isValidMaskShape(mask: unknown): mask is MaskShape {
  if (typeof mask !== 'object' || mask === null) {
    return false;
  }
  const m = mask as Record<string, unknown>;
  if (m.type === 'none' || m.type === 'circle') {
    return true;
  }
  if (m.type === 'rounded-rect') {
    return typeof m.radius === 'number' && m.radius >= 0;
  }
  return false;
}

function isValidGradientStop(stop: unknown): stop is GradientStop {
  if (typeof stop !== 'object' || stop === null) {
    return false;
  }
  const s = stop as Record<string, unknown>;
  return (
    typeof s.color === 'string' &&
    isValidHexColor(s.color) &&
    typeof s.position === 'number' &&
    s.position >= 0 &&
    s.position <= 100
  );
}

function validateBackground(background: unknown, errors: string[]): boolean {
  if (typeof background !== 'object' || background === null) {
    errors.push('background must be an object');
    return false;
  }

  const bg = background as Record<string, unknown>;

  if (bg.type === 'solid') {
    if (typeof bg.color !== 'string' || !isValidHexColor(bg.color)) {
      errors.push('background.color must be a valid hex color (e.g., #rrggbb)');
      return false;
    }
    return true;
  }

  if (bg.type === 'gradient') {
    if (!['to-bottom', 'to-right', 'to-bottom-right', 'radial'].includes(bg.direction as string)) {
      errors.push(
        'background.direction must be one of: to-bottom, to-right, to-bottom-right, radial'
      );
      return false;
    }
    if (!Array.isArray(bg.stops) || bg.stops.length < 2 || bg.stops.length > 4) {
      errors.push('background.stops must be an array with 2-4 color stops');
      return false;
    }
    for (let i = 0; i < bg.stops.length; i++) {
      if (!isValidGradientStop(bg.stops[i])) {
        errors.push(`background.stops[${i}] must have valid color (#rrggbb) and position (0-100)`);
        return false;
      }
    }
    return true;
  }

  if (bg.type === 'image') {
    if (typeof bg.path !== 'string' || bg.path.trim() === '') {
      errors.push('background.path must be a non-empty string');
      return false;
    }
    // Security: Prevent path traversal attacks
    const path = bg.path;
    if (path.startsWith('/') || path.startsWith('\\')) {
      errors.push('background.path must be a relative path, not absolute');
      return false;
    }
    if (path.includes('..')) {
      errors.push('background.path cannot contain ".." (path traversal)');
      return false;
    }
    return true;
  }

  errors.push('background.type must be one of: solid, gradient, image');
  return false;
}

function validatePhotoField(photo: unknown, index: number, errors: string[]): boolean {
  if (typeof photo !== 'object' || photo === null) {
    errors.push(`photos[${index}] must be an object`);
    return false;
  }

  const p = photo as Record<string, unknown>;
  let valid = true;

  if (typeof p.id !== 'string' || p.id.trim() === '') {
    errors.push(`photos[${index}].id must be a non-empty string`);
    valid = false;
  }

  if (!isValidPosition(p.position)) {
    errors.push(
      `photos[${index}].position must be a valid position (center, top-center, etc. or {x, y})`
    );
    valid = false;
  }

  if (typeof p.size !== 'object' || p.size === null) {
    errors.push(`photos[${index}].size must be an object with width and height`);
    valid = false;
  } else {
    const size = p.size as Record<string, unknown>;
    if (typeof size.width !== 'number' || size.width <= 0) {
      errors.push(`photos[${index}].size.width must be a positive number`);
      valid = false;
    }
    if (typeof size.height !== 'number' || size.height <= 0) {
      errors.push(`photos[${index}].size.height must be a positive number`);
      valid = false;
    }
  }

  if (p.mask !== undefined && !isValidMaskShape(p.mask)) {
    errors.push(`photos[${index}].mask must be a valid mask shape`);
    valid = false;
  }

  if (p.border !== undefined) {
    const border = p.border as Record<string, unknown>;
    if (typeof border.width !== 'number' || border.width < 0) {
      errors.push(`photos[${index}].border.width must be a non-negative number`);
      valid = false;
    }
    if (typeof border.color !== 'string' || !isValidHexColor(border.color)) {
      errors.push(`photos[${index}].border.color must be a valid hex color`);
      valid = false;
    }
  }

  if (p.shadow !== undefined) {
    const shadow = p.shadow as Record<string, unknown>;
    if (typeof shadow.blur !== 'number' || shadow.blur < 0) {
      errors.push(`photos[${index}].shadow.blur must be a non-negative number`);
      valid = false;
    }
    if (typeof shadow.offsetX !== 'number') {
      errors.push(`photos[${index}].shadow.offsetX must be a number`);
      valid = false;
    }
    if (typeof shadow.offsetY !== 'number') {
      errors.push(`photos[${index}].shadow.offsetY must be a number`);
      valid = false;
    }
    if (typeof shadow.color !== 'string' || !isValidColor(shadow.color)) {
      errors.push(
        `photos[${index}].shadow.color must be a valid color (#rrggbb or rgba(r,g,b,a))`
      );
      valid = false;
    }
  }

  return valid;
}

function validateTextStyle(style: unknown, path: string, errors: string[]): boolean {
  if (typeof style !== 'object' || style === null) {
    errors.push(`${path} must be an object`);
    return false;
  }

  const s = style as Record<string, unknown>;
  let valid = true;

  if (typeof s.fontFamily !== 'string' || s.fontFamily.trim() === '') {
    errors.push(`${path}.fontFamily must be a non-empty string`);
    valid = false;
  }

  if (typeof s.fontSize !== 'number' || s.fontSize < MIN_FONT_SIZE || s.fontSize > MAX_FONT_SIZE) {
    errors.push(`${path}.fontSize must be a number between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}`);
    valid = false;
  }

  if (typeof s.color !== 'string' || !isValidHexColor(s.color)) {
    errors.push(`${path}.color must be a valid hex color (e.g., #rrggbb)`);
    valid = false;
  }

  if (s.align !== undefined && !['left', 'center', 'right'].includes(s.align as string)) {
    errors.push(`${path}.align must be one of: left, center, right`);
    valid = false;
  }

  if (s.letterSpacing !== undefined && typeof s.letterSpacing !== 'number') {
    errors.push(`${path}.letterSpacing must be a number`);
    valid = false;
  }

  if (
    s.textTransform !== undefined &&
    !['none', 'uppercase', 'lowercase', 'capitalize'].includes(s.textTransform as string)
  ) {
    errors.push(`${path}.textTransform must be one of: none, uppercase, lowercase, capitalize`);
    valid = false;
  }

  return valid;
}

function validateTextField(text: unknown, index: number, errors: string[]): boolean {
  if (typeof text !== 'object' || text === null) {
    errors.push(`text[${index}] must be an object`);
    return false;
  }

  const t = text as Record<string, unknown>;
  let valid = true;

  if (typeof t.id !== 'string' || t.id.trim() === '') {
    errors.push(`text[${index}].id must be a non-empty string`);
    valid = false;
  }

  if (!isValidPosition(t.position)) {
    errors.push(
      `text[${index}].position must be a valid position (center, top-center, etc. or {x, y})`
    );
    valid = false;
  }

  if (!validateTextStyle(t.style, `text[${index}].style`, errors)) {
    valid = false;
  }

  if (t.placeholder !== undefined && typeof t.placeholder !== 'string') {
    errors.push(`text[${index}].placeholder must be a string`);
    valid = false;
  }

  return valid;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validation result with errors if invalid.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a template configuration.
 *
 * @param template - The template object to validate
 * @returns Validation result with boolean and error messages
 *
 * @example
 * ```typescript
 * const result = validateTemplate(myTemplate);
 * if (!result.valid) {
 *   console.error('Template errors:', result.errors);
 * }
 * ```
 */
export function validateTemplate(template: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof template !== 'object' || template === null) {
    return { valid: false, errors: ['Template must be an object'] };
  }

  const t = template as Record<string, unknown>;

  // Validate required string fields
  if (typeof t.id !== 'string' || t.id.trim() === '') {
    errors.push('id must be a non-empty string');
  }
  if (typeof t.name !== 'string' || t.name.trim() === '') {
    errors.push('name must be a non-empty string');
  }
  if (typeof t.description !== 'string') {
    errors.push('description must be a string');
  }
  if (typeof t.version !== 'string' || t.version.trim() === '') {
    errors.push('version must be a non-empty string');
  }

  // Validate canvas
  if (typeof t.canvas !== 'object' || t.canvas === null) {
    errors.push('canvas must be an object with width and height');
  } else {
    const canvas = t.canvas as Record<string, unknown>;
    if (
      typeof canvas.width !== 'number' ||
      canvas.width < MIN_DIMENSION ||
      canvas.width > MAX_DIMENSION
    ) {
      errors.push(`canvas.width must be a number between ${MIN_DIMENSION} and ${MAX_DIMENSION}`);
    }
    if (
      typeof canvas.height !== 'number' ||
      canvas.height < MIN_DIMENSION ||
      canvas.height > MAX_DIMENSION
    ) {
      errors.push(`canvas.height must be a number between ${MIN_DIMENSION} and ${MAX_DIMENSION}`);
    }
  }

  // Validate background
  validateBackground(t.background, errors);

  // Validate photos array
  if (!Array.isArray(t.photos)) {
    errors.push('photos must be an array');
  } else {
    for (let i = 0; i < t.photos.length; i++) {
      validatePhotoField(t.photos[i], i, errors);
    }
  }

  // Validate text array
  if (!Array.isArray(t.text)) {
    errors.push('text must be an array');
  } else {
    for (let i = 0; i < t.text.length; i++) {
      validateTextField(t.text[i], i, errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard that validates a template and narrows the type.
 *
 * @param template - The template object to validate
 * @returns True if the template is valid
 *
 * @example
 * ```typescript
 * if (isValidTemplate(maybeTemplate)) {
 *   // TypeScript knows maybeTemplate is PosterTemplate here
 *   console.log(maybeTemplate.name);
 * }
 * ```
 */
export function isValidTemplate(template: unknown): template is PosterTemplate {
  return validateTemplate(template).valid;
}

/**
 * Register a template in the template registry.
 *
 * @param template - The template to register
 * @throws {TemplateValidationError} When template validation fails
 *
 * @example
 * ```typescript
 * registerTemplate(myTemplate);
 * ```
 */
export function registerTemplate(template: PosterTemplate): void {
  const result = validateTemplate(template);
  if (!result.valid) {
    throw new TemplateValidationError(result.errors);
  }
  templateRegistry.set(template.id, template);
}

/**
 * Load a template by ID.
 *
 * @param templateId - The unique template identifier
 * @returns The template configuration
 * @throws {TemplateNotFoundError} When template is not found
 *
 * @example
 * ```typescript
 * const template = loadTemplate('classic');
 * console.log(template.name); // "Classic Tournament"
 * ```
 */
export function loadTemplate(templateId: string): PosterTemplate {
  const template = templateRegistry.get(templateId);
  if (!template) {
    throw new TemplateNotFoundError(templateId);
  }
  return template;
}

/**
 * Check if a template is registered.
 *
 * @param templateId - The unique template identifier
 * @returns True if the template is registered
 */
export function isTemplateRegistered(templateId: string): boolean {
  return templateRegistry.has(templateId);
}

/**
 * List all available templates.
 *
 * @returns Array of template summaries with id and name
 *
 * @example
 * ```typescript
 * const templates = listTemplates();
 * // [{ id: 'classic', name: 'Classic Tournament' }, ...]
 * ```
 */
export function listTemplates(): Array<{ id: string; name: string; description: string }> {
  return Array.from(templateRegistry.values()).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));
}

/**
 * Get all registered templates.
 *
 * @returns Array of all registered templates
 */
export function getAllTemplates(): PosterTemplate[] {
  return Array.from(templateRegistry.values());
}

/**
 * Clear all registered templates.
 * Useful for testing.
 */
export function clearTemplates(): void {
  templateRegistry.clear();
}
