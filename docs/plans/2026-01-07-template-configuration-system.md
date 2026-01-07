# Template Configuration System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a template configuration system that defines poster layouts so multiple styles can be created without code changes.

**Architecture:** TypeScript objects define templates with Zod validation. Templates specify canvas, background, photo fields, and text fields. API provides `loadTemplate()`, `listTemplates()`, and `validateTemplate()` functions.

**Tech Stack:** TypeScript, Zod (already installed), Vitest for testing.

---

## Task 1: Create Template Types

**Files:**
- Create: `packages/core/src/templates/types.ts`

**Step 1: Write the types file**

```typescript
// packages/core/src/templates/types.ts

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
```

**Step 2: Verify file compiles**

Run: `cd packages/core && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/core/src/templates/types.ts
git commit -m "feat(core): add template type definitions"
```

---

## Task 2: Create Template Error Classes

**Files:**
- Create: `packages/core/src/templates/errors.ts`

**Step 1: Write the errors file**

```typescript
// packages/core/src/templates/errors.ts

import type { ZodIssue } from 'zod';
import { AppError } from '../errors.js';

/**
 * Error thrown when a template is not found
 */
export class TemplateNotFoundError extends AppError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 404, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Error thrown when template validation fails
 */
export class TemplateValidationError extends AppError {
  public readonly issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(message, 400, 'TEMPLATE_VALIDATION_ERROR');
    this.name = 'TemplateValidationError';
    this.issues = issues;
  }
}
```

**Step 2: Verify file compiles**

Run: `cd packages/core && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/core/src/templates/errors.ts
git commit -m "feat(core): add template error classes"
```

---

## Task 3: Create Zod Validation Schema

**Files:**
- Create: `packages/core/src/templates/schema.ts`
- Test: `packages/core/src/templates/__tests__/schema.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/templates/__tests__/schema.test.ts

import { describe, it, expect } from 'vitest';
import { PosterTemplateSchema } from '../schema.js';

describe('PosterTemplateSchema', () => {
  const validTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    version: '1.0.0',
    canvas: { width: 1080, height: 1350 },
    background: { type: 'solid', color: '#1a1a1a' },
    photos: [
      {
        id: 'athletePhoto',
        position: { anchor: 'center', offsetX: 0, offsetY: 0 },
        size: { width: 500, height: 500 },
      },
    ],
    text: [
      {
        id: 'athleteName',
        position: { anchor: 'center', offsetX: 0, offsetY: 300 },
        style: {
          fontFamily: 'Montserrat-Bold',
          fontSize: 64,
          color: '#ffffff',
        },
      },
    ],
  };

  it('should validate a valid template', () => {
    const result = PosterTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it('should reject template with missing id', () => {
    const { id: _, ...invalid } = validTemplate;
    const result = PosterTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject template with invalid version format', () => {
    const invalid = { ...validTemplate, version: 'v1' };
    const result = PosterTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject template with empty photos array', () => {
    const invalid = { ...validTemplate, photos: [] };
    const result = PosterTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate template with gradient background', () => {
    const withGradient = {
      ...validTemplate,
      background: {
        type: 'gradient',
        direction: 'to-bottom',
        stops: [
          { color: '#000000', position: 0 },
          { color: '#ffffff', position: 100 },
        ],
      },
    };
    const result = PosterTemplateSchema.safeParse(withGradient);
    expect(result.success).toBe(true);
  });

  it('should validate template with image background', () => {
    const withImage = {
      ...validTemplate,
      background: { type: 'image', path: 'backgrounds/test.png' },
    };
    const result = PosterTemplateSchema.safeParse(withImage);
    expect(result.success).toBe(true);
  });

  it('should validate template with photo mask and border', () => {
    const withEffects = {
      ...validTemplate,
      photos: [
        {
          id: 'athletePhoto',
          position: { anchor: 'center', offsetX: 0, offsetY: 0 },
          size: { width: 500, height: 500 },
          mask: { type: 'circle' },
          border: { width: 4, color: '#ffd700' },
          shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
        },
      ],
    };
    const result = PosterTemplateSchema.safeParse(withEffects);
    expect(result.success).toBe(true);
  });

  it('should reject negative canvas dimensions', () => {
    const invalid = { ...validTemplate, canvas: { width: -100, height: 1350 } };
    const result = PosterTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid anchor position', () => {
    const invalid = {
      ...validTemplate,
      photos: [
        {
          id: 'athletePhoto',
          position: { anchor: 'invalid-anchor', offsetX: 0, offsetY: 0 },
          size: { width: 500, height: 500 },
        },
      ],
    };
    const result = PosterTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/schema.test.ts`
Expected: FAIL - module not found

**Step 3: Write the schema implementation**

```typescript
// packages/core/src/templates/schema.ts

import { z } from 'zod';

/**
 * Schema for template position (anchor + offset)
 */
export const TemplatePositionSchema = z.object({
  anchor: z.enum([
    'center',
    'top-center',
    'bottom-center',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]),
  offsetX: z.number(),
  offsetY: z.number(),
});

/**
 * Schema for mask shapes
 */
export const MaskShapeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('circle') }),
  z.object({ type: z.literal('rounded-rect'), radius: z.number().positive() }),
]);

/**
 * Schema for text style
 */
export const TextStyleSchema = z.object({
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  color: z.string().min(1),
  align: z.enum(['left', 'center', 'right']).optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  stroke: z
    .object({
      width: z.number().nonnegative(),
      color: z.string().min(1),
    })
    .optional(),
  shadow: z
    .object({
      blur: z.number().nonnegative(),
      offsetX: z.number(),
      offsetY: z.number(),
      color: z.string().min(1),
    })
    .optional(),
  maxWidth: z.number().positive().optional(),
});

/**
 * Schema for text field definition
 */
export const TemplateTextFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  style: TextStyleSchema,
  placeholder: z.string().optional(),
});

/**
 * Schema for photo field definition
 */
export const TemplatePhotoFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  mask: MaskShapeSchema.optional(),
  border: z
    .object({
      width: z.number().nonnegative(),
      color: z.string().min(1),
    })
    .optional(),
  shadow: z
    .object({
      blur: z.number().nonnegative(),
      offsetX: z.number(),
      offsetY: z.number(),
      color: z.string().min(1),
    })
    .optional(),
});

/**
 * Schema for gradient direction
 */
export const GradientDirectionSchema = z.enum([
  'to-bottom',
  'to-right',
  'to-bottom-right',
  'radial',
]);

/**
 * Schema for gradient stop
 */
export const GradientStopSchema = z.object({
  color: z.string().min(1),
  position: z.number().min(0).max(100),
});

/**
 * Schema for template background
 */
export const TemplateBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string().min(1) }),
  z.object({
    type: z.literal('gradient'),
    direction: GradientDirectionSchema,
    stops: z.array(GradientStopSchema).min(2),
  }),
  z.object({ type: z.literal('image'), path: z.string().min(1) }),
]);

/**
 * Schema for complete poster template
 */
export const PosterTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  background: TemplateBackgroundSchema,
  photos: z.array(TemplatePhotoFieldSchema).min(1),
  text: z.array(TemplateTextFieldSchema),
});

/**
 * Inferred type from the schema
 */
export type PosterTemplateInput = z.input<typeof PosterTemplateSchema>;
```

**Step 4: Create the __tests__ directory**

Run: `mkdir -p packages/core/src/templates/__tests__`

**Step 5: Run test to verify it passes**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/schema.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/core/src/templates/schema.ts packages/core/src/templates/__tests__/schema.test.ts
git commit -m "feat(core): add Zod validation schema for templates"
```

---

## Task 4: Create Classic Template

**Files:**
- Create: `packages/core/src/templates/classic.ts`
- Test: `packages/core/src/templates/__tests__/classic.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/templates/__tests__/classic.test.ts

import { describe, it, expect } from 'vitest';
import { classicTemplate } from '../classic.js';
import { PosterTemplateSchema } from '../schema.js';

describe('classicTemplate', () => {
  it('should have correct id', () => {
    expect(classicTemplate.id).toBe('classic');
  });

  it('should have correct canvas dimensions (Instagram portrait)', () => {
    expect(classicTemplate.canvas).toEqual({ width: 1080, height: 1350 });
  });

  it('should have solid dark background', () => {
    expect(classicTemplate.background).toEqual({ type: 'solid', color: '#1a1a1a' });
  });

  it('should have one photo field with circle mask and gold border', () => {
    expect(classicTemplate.photos).toHaveLength(1);
    expect(classicTemplate.photos[0].id).toBe('athletePhoto');
    expect(classicTemplate.photos[0].mask).toEqual({ type: 'circle' });
    expect(classicTemplate.photos[0].border?.color).toBe('#ffd700');
  });

  it('should have four text fields', () => {
    expect(classicTemplate.text).toHaveLength(4);
    const fieldIds = classicTemplate.text.map((t) => t.id);
    expect(fieldIds).toContain('athleteName');
    expect(fieldIds).toContain('achievement');
    expect(fieldIds).toContain('tournamentName');
    expect(fieldIds).toContain('date');
  });

  it('should pass schema validation', () => {
    const result = PosterTemplateSchema.safeParse(classicTemplate);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/classic.test.ts`
Expected: FAIL - module not found

**Step 3: Write the classic template**

```typescript
// packages/core/src/templates/classic.ts

import type { PosterTemplate } from './types.js';

/**
 * Classic template - traditional tournament poster with centered photo and bold text
 */
export const classicTemplate: PosterTemplate = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional tournament poster with centered photo and bold text',
  version: '1.0.0',
  canvas: {
    width: 1080,
    height: 1350,
  },
  background: {
    type: 'solid',
    color: '#1a1a1a',
  },
  photos: [
    {
      id: 'athletePhoto',
      position: { anchor: 'center', offsetX: 0, offsetY: -100 },
      size: { width: 500, height: 500 },
      mask: { type: 'circle' },
      border: { width: 4, color: '#ffd700' },
    },
  ],
  text: [
    {
      id: 'athleteName',
      position: { anchor: 'center', offsetX: 0, offsetY: 220 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 64,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'achievement',
      position: { anchor: 'center', offsetX: 0, offsetY: 300 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 48,
        color: '#ffd700',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'GOLD MEDAL',
    },
    {
      id: 'tournamentName',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -120 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 32,
        color: '#cccccc',
        align: 'center',
      },
      placeholder: 'Tournament Name',
    },
    {
      id: 'date',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -70 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 24,
        color: '#888888',
        align: 'center',
      },
      placeholder: 'January 2026',
    },
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/classic.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/core/src/templates/classic.ts packages/core/src/templates/__tests__/classic.test.ts
git commit -m "feat(core): add classic poster template"
```

---

## Task 5: Create Modern Template

**Files:**
- Create: `packages/core/src/templates/modern.ts`
- Test: `packages/core/src/templates/__tests__/modern.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/templates/__tests__/modern.test.ts

import { describe, it, expect } from 'vitest';
import { modernTemplate } from '../modern.js';
import { PosterTemplateSchema } from '../schema.js';

describe('modernTemplate', () => {
  it('should have correct id', () => {
    expect(modernTemplate.id).toBe('modern');
  });

  it('should have correct canvas dimensions (Instagram portrait)', () => {
    expect(modernTemplate.canvas).toEqual({ width: 1080, height: 1350 });
  });

  it('should have gradient background', () => {
    expect(modernTemplate.background.type).toBe('gradient');
    if (modernTemplate.background.type === 'gradient') {
      expect(modernTemplate.background.direction).toBe('to-bottom-right');
      expect(modernTemplate.background.stops.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have one photo field with rounded-rect mask and shadow', () => {
    expect(modernTemplate.photos).toHaveLength(1);
    expect(modernTemplate.photos[0].id).toBe('athletePhoto');
    expect(modernTemplate.photos[0].mask).toEqual({ type: 'rounded-rect', radius: 24 });
    expect(modernTemplate.photos[0].shadow).toBeDefined();
  });

  it('should have four text fields', () => {
    expect(modernTemplate.text).toHaveLength(4);
    const fieldIds = modernTemplate.text.map((t) => t.id);
    expect(fieldIds).toContain('athleteName');
    expect(fieldIds).toContain('achievement');
    expect(fieldIds).toContain('tournamentName');
    expect(fieldIds).toContain('date');
  });

  it('should use teal accent color for achievement', () => {
    const achievement = modernTemplate.text.find((t) => t.id === 'achievement');
    expect(achievement?.style.color).toBe('#4ecdc4');
  });

  it('should pass schema validation', () => {
    const result = PosterTemplateSchema.safeParse(modernTemplate);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/modern.test.ts`
Expected: FAIL - module not found

**Step 3: Write the modern template**

```typescript
// packages/core/src/templates/modern.ts

import type { PosterTemplate } from './types.js';

/**
 * Modern template - contemporary design with gradient background and rounded photo
 */
export const modernTemplate: PosterTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with gradient background and rounded photo',
  version: '1.0.0',
  canvas: {
    width: 1080,
    height: 1350,
  },
  background: {
    type: 'gradient',
    direction: 'to-bottom-right',
    stops: [
      { color: '#1e3a5f', position: 0 },
      { color: '#0d1b2a', position: 100 },
    ],
  },
  photos: [
    {
      id: 'athletePhoto',
      position: { anchor: 'top-center', offsetX: 0, offsetY: 150 },
      size: { width: 450, height: 450 },
      mask: { type: 'rounded-rect', radius: 24 },
      shadow: { blur: 30, offsetX: 0, offsetY: 15, color: 'rgba(0,0,0,0.5)' },
    },
  ],
  text: [
    {
      id: 'athleteName',
      position: { anchor: 'center', offsetX: 0, offsetY: 100 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 56,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'achievement',
      position: { anchor: 'center', offsetX: 0, offsetY: 170 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 40,
        color: '#4ecdc4',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'CHAMPION',
    },
    {
      id: 'tournamentName',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -100 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 28,
        color: '#a0a0a0',
        align: 'center',
      },
      placeholder: 'Tournament Name',
    },
    {
      id: 'date',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -60 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 20,
        color: '#707070',
        align: 'center',
      },
      placeholder: 'January 2026',
    },
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/modern.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/core/src/templates/modern.ts packages/core/src/templates/__tests__/modern.test.ts
git commit -m "feat(core): add modern poster template"
```

---

## Task 6: Create Template API (loadTemplate, listTemplates, validateTemplate)

**Files:**
- Create: `packages/core/src/templates/index.ts`
- Test: `packages/core/src/templates/__tests__/index.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/templates/__tests__/index.test.ts

import { describe, it, expect } from 'vitest';
import { loadTemplate, listTemplates, validateTemplate } from '../index.js';
import { TemplateNotFoundError } from '../errors.js';

describe('loadTemplate', () => {
  it('should load classic template by id', () => {
    const template = loadTemplate('classic');
    expect(template.id).toBe('classic');
    expect(template.name).toBe('Classic');
  });

  it('should load modern template by id', () => {
    const template = loadTemplate('modern');
    expect(template.id).toBe('modern');
    expect(template.name).toBe('Modern');
  });

  it('should throw TemplateNotFoundError for unknown id', () => {
    expect(() => loadTemplate('nonexistent')).toThrow(TemplateNotFoundError);
    expect(() => loadTemplate('nonexistent')).toThrow('Template not found: nonexistent');
  });
});

describe('listTemplates', () => {
  it('should return array of template info', () => {
    const templates = listTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThanOrEqual(2);
  });

  it('should include classic template', () => {
    const templates = listTemplates();
    const classic = templates.find((t) => t.id === 'classic');
    expect(classic).toBeDefined();
    expect(classic?.name).toBe('Classic');
    expect(classic?.description).toBeDefined();
  });

  it('should include modern template', () => {
    const templates = listTemplates();
    const modern = templates.find((t) => t.id === 'modern');
    expect(modern).toBeDefined();
    expect(modern?.name).toBe('Modern');
    expect(modern?.description).toBeDefined();
  });

  it('should only return id, name, and description', () => {
    const templates = listTemplates();
    const template = templates[0];
    expect(Object.keys(template).sort()).toEqual(['description', 'id', 'name']);
  });
});

describe('validateTemplate', () => {
  it('should return success for valid template', () => {
    const validTemplate = {
      id: 'test',
      name: 'Test',
      description: 'Test template',
      version: '1.0.0',
      canvas: { width: 1080, height: 1350 },
      background: { type: 'solid', color: '#000000' },
      photos: [
        {
          id: 'photo',
          position: { anchor: 'center', offsetX: 0, offsetY: 0 },
          size: { width: 100, height: 100 },
        },
      ],
      text: [],
    };
    const result = validateTemplate(validTemplate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('test');
    }
  });

  it('should return failure with errors for invalid template', () => {
    const invalidTemplate = {
      id: '',
      name: 'Test',
      version: 'invalid',
    };
    const result = validateTemplate(invalidTemplate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should validate bundled templates successfully', () => {
    const classic = loadTemplate('classic');
    const modern = loadTemplate('modern');

    expect(validateTemplate(classic).success).toBe(true);
    expect(validateTemplate(modern).success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/index.test.ts`
Expected: FAIL - module not found

**Step 3: Write the API implementation**

```typescript
// packages/core/src/templates/index.ts

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
export { TemplateNotFoundError, TemplateValidationError } from './errors.js';
export { PosterTemplateSchema } from './schema.js';

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
export function validateTemplate(template: unknown) {
  return PosterTemplateSchema.safeParse(template);
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && pnpm test -- src/templates/__tests__/index.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/core/src/templates/index.ts packages/core/src/templates/__tests__/index.test.ts
git commit -m "feat(core): add template API (loadTemplate, listTemplates, validateTemplate)"
```

---

## Task 7: Export Templates from Package Barrel

**Files:**
- Modify: `packages/core/src/index.ts`

**Step 1: Update the barrel export**

Add this line to `packages/core/src/index.ts`:

```typescript
export * from './templates/index.js';
```

The file should now look like:

```typescript
// packages/core/src/index.ts

// ===========================================
// @bjj-poster/core - Shared utilities and types
// ===========================================

// Re-export all modules
export * from './errors.js';
export * from './logger.js';
export * from './types.js';
export * from './image/index.js';
export * from './templates/index.js';
```

**Step 2: Verify type-check passes**

Run: `cd packages/core && pnpm type-check`
Expected: No errors

**Step 3: Verify all tests pass**

Run: `cd packages/core && pnpm test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export templates from package barrel"
```

---

## Task 8: Run Full Quality Checks

**Step 1: Run lint**

Run: `cd packages/core && pnpm lint`
Expected: No errors

**Step 2: Run type-check**

Run: `cd packages/core && pnpm type-check`
Expected: No errors

**Step 3: Run all tests**

Run: `cd packages/core && pnpm test`
Expected: All tests PASS

**Step 4: Build package**

Run: `cd packages/core && pnpm build`
Expected: Build succeeds

**Step 5: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "fix(core): address lint issues" --allow-empty
```

---

## Summary

After completing all tasks, the template system will have:

| Component | File |
|-----------|------|
| Types | `packages/core/src/templates/types.ts` |
| Errors | `packages/core/src/templates/errors.ts` |
| Schema | `packages/core/src/templates/schema.ts` |
| Classic | `packages/core/src/templates/classic.ts` |
| Modern | `packages/core/src/templates/modern.ts` |
| API | `packages/core/src/templates/index.ts` |
| Tests | `packages/core/src/templates/__tests__/*.test.ts` |

**API exports:**
- `loadTemplate(id)` - Load template by ID
- `listTemplates()` - List available templates
- `validateTemplate(obj)` - Validate template config
- `PosterTemplate` type and related types
- `TemplateNotFoundError`, `TemplateValidationError` errors
- `PosterTemplateSchema` Zod schema
