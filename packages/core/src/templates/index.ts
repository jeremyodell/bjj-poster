import type { z } from 'zod';
import { PosterTemplateSchema } from './schema.js';
import { TemplateNotFoundError } from './errors.js';
import { classicTemplate } from './classic.js';
import { modernTemplate } from './modern.js';
import type { PosterTemplate } from './types.js';

// Re-export types and errors
export type {
  PosterTemplate,
  TemplatePosition,
  TemplateTextField,
  TemplatePhotoField,
  TemplateBackground,
} from './types.js';
export type { PosterTemplateInput } from './schema.js';
export { TemplateNotFoundError, TemplateValidationError } from './errors.js';
export { PosterTemplateSchema, ColorSchema } from './schema.js';

/**
 * Registry of bundled templates
 */
const BUNDLED_TEMPLATES: Map<string, PosterTemplate> = new Map([
  ['classic', classicTemplate],
  ['modern', modernTemplate],
]);

/**
 * Load a template by ID
 *
 * @param templateId - The template identifier
 * @returns The poster template
 * @throws {TemplateNotFoundError} If template doesn't exist
 *
 * @example
 * ```typescript
 * const template = loadTemplate('classic');
 * console.log(template.name); // "Classic"
 * ```
 */
export function loadTemplate(templateId: string): PosterTemplate {
  const template = BUNDLED_TEMPLATES.get(templateId);
  if (!template) {
    throw new TemplateNotFoundError(templateId);
  }
  return template;
}

/**
 * List all available templates
 *
 * @returns Array of template summaries (id, name, description)
 *
 * @example
 * ```typescript
 * const templates = listTemplates();
 * // [{ id: 'classic', name: 'Classic', description: '...' }, ...]
 * ```
 */
export function listTemplates(): Array<{ id: string; name: string; description: string }> {
  return Array.from(BUNDLED_TEMPLATES.values()).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));
}

/**
 * Validate a template configuration
 *
 * @param template - The template object to validate
 * @returns Zod SafeParseReturnType with success/error info
 *
 * @example
 * ```typescript
 * const result = validateTemplate(myTemplate);
 * if (result.success) {
 *   console.log('Valid template:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.issues);
 * }
 * ```
 */
export function validateTemplate(
  template: unknown
): z.SafeParseReturnType<z.input<typeof PosterTemplateSchema>, z.output<typeof PosterTemplateSchema>> {
  return PosterTemplateSchema.safeParse(template);
}
