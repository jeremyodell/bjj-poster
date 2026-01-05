import { registerTemplate } from '../image/template.js';
import { classicTemplate } from './classic.js';
import { modernTemplate } from './modern.js';

export { classicTemplate } from './classic.js';
export { modernTemplate } from './modern.js';

/**
 * Initialize all bundled templates by registering them in the template registry.
 *
 * @example
 * ```typescript
 * import { initBundledTemplates, loadTemplate } from '@bjj-poster/core';
 *
 * initBundledTemplates();
 * const classic = loadTemplate('classic');
 * ```
 */
export function initBundledTemplates(): void {
  registerTemplate(classicTemplate);
  registerTemplate(modernTemplate);
}

/**
 * List of all bundled template IDs.
 * Derived from the actual template objects to prevent drift.
 */
export const bundledTemplateIds = [classicTemplate.id, modernTemplate.id] as const;
