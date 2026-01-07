# Template Configuration System Design

**Issue:** ODE-9 - IMG-005: Create Template Configuration System
**Date:** 2026-01-07
**Status:** Approved

## Overview

A template configuration system that defines poster layouts (background, photo placement, text positions) so that multiple poster styles can be created without code changes.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Template format | Pure TypeScript objects | Type safety, IDE autocomplete, compile-time validation |
| Position system | Named anchors + offset | Intuitive layout, precise control via offsets |
| Background images | Relative paths in assets/ | Self-contained package, no network dependency |
| Validation | Zod schemas | Excellent TypeScript integration, detailed errors |
| Photo fields | Single photo per template | Covers primary use case, array allows future expansion |
| Text fields | Minimal set (4 fields) | Core use case: athleteName, tournamentName, achievement, date |

## Type Definitions

```typescript
// packages/core/src/templates/types.ts

import type { MaskShape, GradientDirection, GradientStop, TextStyle } from '../image/types.js';

/** Position using anchor + offset for intuitive layout */
export interface TemplatePosition {
  anchor: 'center' | 'top-center' | 'bottom-center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offsetX: number;
  offsetY: number;
}

/** Text field definition in a template */
export interface TemplateTextField {
  id: string;                    // e.g., "athleteName", "tournamentName"
  position: TemplatePosition;
  style: TextStyle;
  placeholder?: string;          // Shown in previews
}

/** Photo field definition in a template */
export interface TemplatePhotoField {
  id: string;                    // e.g., "athletePhoto"
  position: TemplatePosition;
  size: { width: number; height: number };
  mask?: MaskShape;
  border?: { width: number; color: string };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
}

/** Background configuration */
export type TemplateBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] }
  | { type: 'image'; path: string };

/** Complete poster template */
export interface PosterTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  canvas: { width: number; height: number };
  background: TemplateBackground;
  photos: TemplatePhotoField[];
  text: TemplateTextField[];
}
```

## Zod Validation Schema

```typescript
// packages/core/src/templates/schema.ts

import { z } from 'zod';

const TemplatePositionSchema = z.object({
  anchor: z.enum(['center', 'top-center', 'bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']),
  offsetX: z.number(),
  offsetY: z.number(),
});

const MaskShapeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('circle') }),
  z.object({ type: z.literal('rounded-rect'), radius: z.number().positive() }),
]);

const TemplateTextFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  style: TextStyleSchema,
  placeholder: z.string().optional(),
});

const TemplatePhotoFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  size: z.object({ width: z.number().positive(), height: z.number().positive() }),
  mask: MaskShapeSchema.optional(),
  border: z.object({ width: z.number().nonnegative(), color: z.string() }).optional(),
  shadow: z.object({ blur: z.number().nonnegative(), offsetX: z.number(), offsetY: z.number(), color: z.string() }).optional(),
});

const TemplateBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string() }),
  z.object({ type: z.literal('gradient'), direction: GradientDirectionSchema, stops: z.array(GradientStopSchema).min(2) }),
  z.object({ type: z.literal('image'), path: z.string().min(1) }),
]);

export const PosterTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  canvas: z.object({ width: z.number().positive(), height: z.number().positive() }),
  background: TemplateBackgroundSchema,
  photos: z.array(TemplatePhotoFieldSchema).min(1),
  text: z.array(TemplateTextFieldSchema),
});
```

## Template API Functions

```typescript
// packages/core/src/templates/index.ts

import { classicTemplate } from './classic.js';
import { modernTemplate } from './modern.js';

const BUNDLED_TEMPLATES: Map<string, PosterTemplate> = new Map([
  ['classic', classicTemplate],
  ['modern', modernTemplate],
]);

/** Load a template by ID */
export function loadTemplate(templateId: string): PosterTemplate {
  const template = BUNDLED_TEMPLATES.get(templateId);
  if (!template) {
    throw new TemplateNotFoundError(`Template not found: ${templateId}`);
  }
  return template;
}

/** List all available templates */
export function listTemplates(): Array<{ id: string; name: string; description: string }> {
  return Array.from(BUNDLED_TEMPLATES.values()).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));
}

/** Validate a template configuration */
export function validateTemplate(template: unknown): ValidationResult<PosterTemplate> {
  return PosterTemplateSchema.safeParse(template);
}
```

## Starter Templates

### Classic Template
- **Style:** Traditional tournament poster
- **Background:** Solid dark (#1a1a1a)
- **Photo:** Centered, circular mask, gold border (#ffd700)
- **Text:** White athlete name, gold achievement, gray tournament info

### Modern Template
- **Style:** Contemporary design
- **Background:** Blue gradient (to-bottom-right)
- **Photo:** Top-center, rounded-rect mask, drop shadow
- **Text:** White athlete name, teal achievement (#4ecdc4), gray info

Both templates use:
- Canvas: 1080x1350 (Instagram portrait)
- Font: Montserrat (Bold + Regular)
- Text fields: athleteName, achievement, tournamentName, date

## File Structure

```
packages/core/src/
├── templates/
│   ├── index.ts              # Public API
│   ├── types.ts              # TypeScript interfaces
│   ├── schema.ts             # Zod validation schemas
│   ├── errors.ts             # TemplateNotFoundError, TemplateValidationError
│   ├── classic.ts            # Classic template
│   ├── modern.ts             # Modern template
│   └── __tests__/
│       └── template.test.ts  # Unit tests
├── index.ts                  # Add template exports
```

## Error Handling

```typescript
export class TemplateNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateValidationError extends Error {
  public readonly errors: z.ZodIssue[];

  constructor(message: string, errors: z.ZodIssue[]) {
    super(message);
    this.name = 'TemplateValidationError';
    this.errors = errors;
  }
}
```

## Dependencies

- Add `zod` to `packages/core/package.json`

## Test Cases

1. Load "classic" template → returns valid template object
2. Load non-existent template → throws TemplateNotFoundError
3. Validate valid template → returns success with data
4. Validate template missing required field → returns failure with error details
5. List templates → returns array with at least 2 templates
