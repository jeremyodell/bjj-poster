# Compose Poster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a high-level `composePoster()` function that takes athlete data, photo, and template ID to produce a complete poster image.

**Architecture:** The function orchestrates existing building blocks (loadTemplate, createCanvas, compositeImage, addText) with a new position converter utility. Stage-based progress callbacks report composition progress. All template text fields require corresponding data.

**Tech Stack:** TypeScript, Sharp (image processing), Zod (validation), Vitest (testing)

---

## Task 1: Position Converter Utility - Tests

**Files:**
- Create: `packages/core/src/image/__tests__/position-utils.test.ts`

**Step 1: Write failing tests for position converter**

```typescript
import { describe, it, expect } from 'vitest';
import { convertTemplatePosition } from '../position-utils.js';
import type { TemplatePosition } from '../../templates/types.js';

describe('convertTemplatePosition', () => {
  const canvas = { width: 1080, height: 1350 };

  describe('center anchor', () => {
    it('converts center anchor with zero offset', () => {
      const pos: TemplatePosition = { anchor: 'center', offsetX: 0, offsetY: 0 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 675 });
    });

    it('converts center anchor with positive offset', () => {
      const pos: TemplatePosition = { anchor: 'center', offsetX: 100, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 640, y: 625 });
    });
  });

  describe('top anchors', () => {
    it('converts top-center anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-center', offsetX: 0, offsetY: 100 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 100 });
    });

    it('converts top-left anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-left', offsetX: 50, offsetY: 50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 50, y: 50 });
    });

    it('converts top-right anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-right', offsetX: -50, offsetY: 50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 1030, y: 50 });
    });
  });

  describe('bottom anchors', () => {
    it('converts bottom-center anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-center', offsetX: 0, offsetY: -100 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 1250 });
    });

    it('converts bottom-left anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-left', offsetX: 50, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 50, y: 1300 });
    });

    it('converts bottom-right anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-right', offsetX: -50, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 1030, y: 1300 });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/position-utils.test.ts`

Expected: FAIL with "Cannot find module '../position-utils.js'"

---

## Task 2: Position Converter Utility - Implementation

**Files:**
- Create: `packages/core/src/image/position-utils.ts`

**Step 3: Implement position converter**

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/position-utils.test.ts`

Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add packages/core/src/image/position-utils.ts packages/core/src/image/__tests__/position-utils.test.ts
git commit -m "feat(core): add position converter utility for template anchors"
```

---

## Task 3: Compose Poster Types

**Files:**
- Create: `packages/core/src/image/compose-poster.ts` (types only initially)

**Step 6: Define types for compose poster**

```typescript
import type { Sharp } from 'sharp';

/**
 * Output format options for composed poster
 */
export interface OutputOptions {
  /** Output format (default: 'png') */
  format?: 'png' | 'jpeg';
  /** JPEG quality 1-100 (default: 85) */
  quality?: number;
  /** Resize the output */
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
}

/**
 * Options for composing a poster
 */
export interface ComposePosterOptions {
  /** Template ID to use (e.g., 'classic', 'modern') */
  templateId: string;
  /** Athlete photo as Buffer */
  athletePhoto: Buffer;
  /** Data keyed by template field IDs */
  data: Record<string, string>;
  /** Output format options */
  output?: OutputOptions;
  /** Progress callback */
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Result from composing a poster
 */
export interface ComposePosterResult {
  /** The composed image buffer */
  buffer: Buffer;
  /** Image metadata */
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Progress stages for poster composition
 */
export const COMPOSE_STAGES = {
  LOADING_TEMPLATE: { name: 'loading-template', percent: 0 },
  CREATING_BACKGROUND: { name: 'creating-background', percent: 10 },
  PROCESSING_PHOTO: { name: 'processing-photo', percent: 30 },
  COMPOSITING_PHOTO: { name: 'compositing-photo', percent: 50 },
  RENDERING_TEXT: { name: 'rendering-text', percent: 70 },
  ENCODING_OUTPUT: { name: 'encoding-output', percent: 90 },
} as const;
```

**Step 7: Commit types**

```bash
git add packages/core/src/image/compose-poster.ts
git commit -m "feat(core): add compose poster types and progress stages"
```

---

## Task 4: Compose Poster - Validation Tests

**Files:**
- Create: `packages/core/src/image/__tests__/compose-poster.test.ts`

**Step 8: Write failing tests for validation**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { composePoster } from '../compose-poster.js';
import { initBundledFonts } from '../fonts.js';
import { TemplateNotFoundError } from '../../templates/errors.js';
import { InvalidInputError } from '../errors.js';

describe('composePoster', () => {
  // Create a valid test image
  let validPhoto: Buffer;

  beforeAll(async () => {
    await initBundledFonts();
    // Create a simple 100x100 red image for testing
    validPhoto = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  describe('validation', () => {
    it('throws TemplateNotFoundError for invalid template ID', async () => {
      await expect(
        composePoster({
          templateId: 'nonexistent-template',
          athletePhoto: validPhoto,
          data: {},
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('throws InvalidInputError when required data fields are missing', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' }, // Missing other required fields
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError with list of missing fields', async () => {
      try {
        await composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' },
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as Error).message).toContain('Missing required data fields');
        expect((error as Error).message).toContain('achievement');
        expect((error as Error).message).toContain('tournamentName');
        expect((error as Error).message).toContain('date');
      }
    });

    it('throws InvalidInputError for invalid photo buffer', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: Buffer.from('not an image'),
          data: {
            athleteName: 'Test',
            achievement: 'Gold',
            tournamentName: 'Worlds',
            date: '2025',
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });
});
```

**Step 9: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/compose-poster.test.ts`

Expected: FAIL with "composePoster is not a function" or similar

---

## Task 5: Compose Poster - Validation Implementation

**Files:**
- Modify: `packages/core/src/image/compose-poster.ts`

**Step 10: Add validation logic to composePoster**

Add after the types in compose-poster.ts:

```typescript
import sharp from 'sharp';
import { loadTemplate } from '../templates/index.js';
import { InvalidInputError } from './errors.js';
import type { PosterTemplate } from '../templates/types.js';

/**
 * Validate that all required template fields have data
 */
function validateTemplateData(template: PosterTemplate, data: Record<string, string>): void {
  const missingFields: string[] = [];

  for (const textField of template.text) {
    if (!(textField.id in data) || data[textField.id] === undefined || data[textField.id] === '') {
      missingFields.push(textField.id);
    }
  }

  if (missingFields.length > 0) {
    throw new InvalidInputError(
      `Missing required data fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Validate that the photo buffer is a valid image
 */
async function validatePhoto(photo: Buffer): Promise<void> {
  try {
    const metadata = await sharp(photo).metadata();
    if (!metadata.width || !metadata.height) {
      throw new InvalidInputError('Photo buffer is not a valid image');
    }
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }
    throw new InvalidInputError(
      `Invalid photo: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Compose a complete poster from template, photo, and data.
 *
 * @param options - Composition options
 * @returns The composed poster buffer and metadata
 * @throws {TemplateNotFoundError} If template doesn't exist
 * @throws {InvalidInputError} If validation fails
 * @throws {ImageProcessingError} If image processing fails
 */
export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult> {
  const { templateId, athletePhoto, data, output, onProgress } = options;

  // Stage: loading-template
  onProgress?.(COMPOSE_STAGES.LOADING_TEMPLATE.name, COMPOSE_STAGES.LOADING_TEMPLATE.percent);

  // Load and validate template
  const template = loadTemplate(templateId);

  // Validate data fields
  validateTemplateData(template, data);

  // Validate photo
  await validatePhoto(athletePhoto);

  // TODO: Implement remaining stages
  throw new Error('Not yet implemented');
}
```

**Step 11: Run validation tests**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/compose-poster.test.ts`

Expected: PASS for validation tests

**Step 12: Commit**

```bash
git add packages/core/src/image/compose-poster.ts packages/core/src/image/__tests__/compose-poster.test.ts
git commit -m "feat(core): add composePoster validation logic"
```

---

## Task 6: Compose Poster - Full Implementation Tests

**Files:**
- Modify: `packages/core/src/image/__tests__/compose-poster.test.ts`

**Step 13: Add tests for successful composition**

Add to the test file:

```typescript
  describe('successful composition', () => {
    const validData = {
      athleteName: 'João Silva',
      achievement: 'Gold Medal',
      tournamentName: 'World Championship 2025',
      date: 'June 2025',
    };

    it('composes poster with valid inputs and returns PNG by default', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.metadata.format).toBe('png');
      expect(result.metadata.width).toBe(1080);
      expect(result.metadata.height).toBe(1350);
      expect(result.metadata.size).toBe(result.buffer.length);
    });

    it('composes poster with JPEG output', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        output: { format: 'jpeg', quality: 90 },
      });

      expect(result.metadata.format).toBe('jpeg');
    });

    it('composes poster with resize option', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        output: { resize: { width: 540 } },
      });

      expect(result.metadata.width).toBe(540);
      // Height should be proportionally scaled
      expect(result.metadata.height).toBe(675);
    });

    it('calls progress callback for each stage', async () => {
      const stages: Array<{ stage: string; percent: number }> = [];

      await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        onProgress: (stage, percent) => {
          stages.push({ stage, percent });
        },
      });

      expect(stages).toContainEqual({ stage: 'loading-template', percent: 0 });
      expect(stages).toContainEqual({ stage: 'creating-background', percent: 10 });
      expect(stages).toContainEqual({ stage: 'processing-photo', percent: 30 });
      expect(stages).toContainEqual({ stage: 'compositing-photo', percent: 50 });
      expect(stages).toContainEqual({ stage: 'rendering-text', percent: 70 });
      expect(stages).toContainEqual({ stage: 'encoding-output', percent: 90 });
    });

    it('works with modern template', async () => {
      const result = await composePoster({
        templateId: 'modern',
        athletePhoto: validPhoto,
        data: {
          athleteName: 'Test Athlete',
          teamName: 'Test Team',
          achievement: 'Champion',
          tournament: 'Test Tournament',
          date: '2025',
        },
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.metadata.width).toBe(1080);
    });
  });
```

**Step 14: Run tests to verify they fail**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/compose-poster.test.ts`

Expected: FAIL with "Not yet implemented"

---

## Task 7: Compose Poster - Full Implementation

**Files:**
- Modify: `packages/core/src/image/compose-poster.ts`

**Step 15: Implement full composition logic**

Replace the `composePoster` function with complete implementation:

```typescript
import sharp from 'sharp';
import { logger } from '../logger.js';
import { loadTemplate } from '../templates/index.js';
import { InvalidInputError, ImageProcessingError } from './errors.js';
import { createCanvas } from './canvas.js';
import { compositeImage } from './composite.js';
import { addText } from './text.js';
import { convertTemplatePosition } from './position-utils.js';
import type { PosterTemplate, TemplateBackground } from '../templates/types.js';
import type { CanvasFill, TextLayer } from './types.js';

// ... keep existing types and validation functions ...

/**
 * Convert template background to canvas fill
 */
function templateBackgroundToFill(background: TemplateBackground): CanvasFill {
  if (background.type === 'solid') {
    return { type: 'solid', color: background.color };
  }
  if (background.type === 'gradient') {
    return {
      type: 'gradient',
      direction: background.direction,
      stops: background.stops,
    };
  }
  // Image backgrounds not yet supported
  throw new InvalidInputError('Image backgrounds are not yet supported');
}

/**
 * Compose a complete poster from template, photo, and data.
 */
export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult> {
  const { templateId, athletePhoto, data, output, onProgress } = options;

  try {
    // Stage: loading-template (0%)
    onProgress?.(COMPOSE_STAGES.LOADING_TEMPLATE.name, COMPOSE_STAGES.LOADING_TEMPLATE.percent);
    logger.debug('composePoster: loading template', { templateId });

    const template = loadTemplate(templateId);
    validateTemplateData(template, data);
    await validatePhoto(athletePhoto);

    // Stage: creating-background (10%)
    onProgress?.(COMPOSE_STAGES.CREATING_BACKGROUND.name, COMPOSE_STAGES.CREATING_BACKGROUND.percent);
    logger.debug('composePoster: creating background');

    const fill = templateBackgroundToFill(template.background);
    const canvas = await createCanvas({
      width: template.canvas.width,
      height: template.canvas.height,
      fill,
    });

    // Stage: processing-photo (30%)
    onProgress?.(COMPOSE_STAGES.PROCESSING_PHOTO.name, COMPOSE_STAGES.PROCESSING_PHOTO.percent);
    logger.debug('composePoster: processing photo');

    // Get the first photo field from template
    const photoField = template.photos[0];
    if (!photoField) {
      throw new InvalidInputError('Template has no photo field defined');
    }

    // Convert template position to absolute coordinates
    const photoPos = convertTemplatePosition(photoField.position, template.canvas);

    // Stage: compositing-photo (50%)
    onProgress?.(COMPOSE_STAGES.COMPOSITING_PHOTO.name, COMPOSE_STAGES.COMPOSITING_PHOTO.percent);
    logger.debug('composePoster: compositing photo');

    // Calculate position adjusted for centering (position is center point, need top-left)
    const composited = await compositeImage({
      background: canvas,
      layers: [
        {
          image: athletePhoto,
          position: {
            x: Math.round(photoPos.x - photoField.size.width / 2),
            y: Math.round(photoPos.y - photoField.size.height / 2),
          },
          size: photoField.size,
          mask: photoField.mask,
          border: photoField.border,
          shadow: photoField.shadow
            ? {
                blur: photoField.shadow.blur,
                offsetX: photoField.shadow.offsetX,
                offsetY: photoField.shadow.offsetY,
                color: photoField.shadow.color,
              }
            : undefined,
        },
      ],
    });

    // Stage: rendering-text (70%)
    onProgress?.(COMPOSE_STAGES.RENDERING_TEXT.name, COMPOSE_STAGES.RENDERING_TEXT.percent);
    logger.debug('composePoster: rendering text', { fieldCount: template.text.length });

    // Convert template text fields to text layers
    const textLayers: TextLayer[] = template.text.map((field) => {
      const pos = convertTemplatePosition(field.position, template.canvas);
      return {
        content: data[field.id],
        position: { x: pos.x, y: pos.y },
        style: field.style,
      };
    });

    const withText = await addText({
      image: composited,
      layers: textLayers,
    });

    // Stage: encoding-output (90%)
    onProgress?.(COMPOSE_STAGES.ENCODING_OUTPUT.name, COMPOSE_STAGES.ENCODING_OUTPUT.percent);
    logger.debug('composePoster: encoding output');

    let outputImage = withText;

    // Apply resize if requested
    if (output?.resize) {
      outputImage = outputImage.resize({
        width: output.resize.width,
        height: output.resize.height,
        fit: output.resize.fit ?? 'contain',
      });
    }

    // Encode to requested format
    const format = output?.format ?? 'png';
    let buffer: Buffer;

    if (format === 'jpeg') {
      buffer = await outputImage.jpeg({ quality: output?.quality ?? 85 }).toBuffer();
    } else {
      buffer = await outputImage.png().toBuffer();
    }

    // Get final metadata
    const metadata = await sharp(buffer).metadata();

    logger.debug('composePoster: complete', {
      width: metadata.width,
      height: metadata.height,
      format,
      size: buffer.length,
    });

    return {
      buffer,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
        format,
        size: buffer.length,
      },
    };
  } catch (error) {
    if (
      error instanceof InvalidInputError ||
      error instanceof ImageProcessingError
    ) {
      throw error;
    }

    // Check for template errors
    if (error && typeof error === 'object' && 'name' in error) {
      if ((error as Error).name === 'TemplateNotFoundError') {
        throw error;
      }
    }

    logger.error('composePoster failed', { error });
    throw new ImageProcessingError(
      `Failed to compose poster: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

**Step 16: Run all tests**

Run: `pnpm --filter @bjj-poster/core test -- src/image/__tests__/compose-poster.test.ts`

Expected: PASS (all tests)

**Step 17: Commit**

```bash
git add packages/core/src/image/compose-poster.ts packages/core/src/image/__tests__/compose-poster.test.ts
git commit -m "feat(core): implement full composePoster function"
```

---

## Task 8: Check Modern Template Fields

**Files:**
- Read: `packages/core/src/templates/modern.ts`

**Step 18: Verify modern template field IDs**

Run: `cat packages/core/src/templates/modern.ts`

Check the text field IDs in the modern template and update the test data accordingly if needed.

---

## Task 9: Export Functions

**Files:**
- Modify: `packages/core/src/image/index.ts`

**Step 19: Add exports for new functions**

Add to `packages/core/src/image/index.ts`:

```typescript
export { composePoster, COMPOSE_STAGES } from './compose-poster.js';
export type {
  ComposePosterOptions,
  ComposePosterResult,
  OutputOptions,
} from './compose-poster.js';
export { convertTemplatePosition } from './position-utils.js';
```

**Step 20: Run type check**

Run: `pnpm --filter @bjj-poster/core type-check`

Expected: No errors

**Step 21: Commit**

```bash
git add packages/core/src/image/index.ts
git commit -m "feat(core): export composePoster and position utilities"
```

---

## Task 10: Run Full Test Suite

**Step 22: Run all core tests**

Run: `pnpm --filter @bjj-poster/core test`

Expected: All tests pass

**Step 23: Run linter**

Run: `pnpm --filter @bjj-poster/core lint`

Expected: No errors

**Step 24: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(core): address linting issues"
```

---

## Summary

**Files Created:**
- `packages/core/src/image/position-utils.ts`
- `packages/core/src/image/compose-poster.ts`
- `packages/core/src/image/__tests__/position-utils.test.ts`
- `packages/core/src/image/__tests__/compose-poster.test.ts`

**Files Modified:**
- `packages/core/src/image/index.ts`

**Commits (expected):**
1. `feat(core): add position converter utility for template anchors`
2. `feat(core): add compose poster types and progress stages`
3. `feat(core): add composePoster validation logic`
4. `feat(core): implement full composePoster function`
5. `feat(core): export composePoster and position utilities`
