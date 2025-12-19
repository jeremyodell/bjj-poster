# Skill: Image Processing with Sharp.js

Use this skill when creating image processing functions for the poster composition engine.

## When to Use

- Creating image loading/manipulation functions
- Building composite operations (layering images)
- Adding text overlays to images
- Working with templates and canvas generation
- Writing tests for visual output

## Package Location

All image processing code lives in: `packages/core/src/image/`

```
packages/core/src/image/
├── index.ts           # Barrel exports
├── loader.ts          # Image loading utilities
├── canvas.ts          # Background generation
├── composite.ts       # Image layering
├── text.ts            # Text rendering
├── template.ts        # Template system
├── compose-poster.ts  # Main composition function
├── types.ts           # Shared types
└── errors.ts          # Image-specific errors
```

## Core Types

Always use these shared types for consistency:

```typescript
// packages/core/src/image/types.ts

import type { Sharp } from 'sharp';

/** Position can be pixel coordinates or named anchor */
export type Position =
  | { x: number; y: number }
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';

/** Gradient direction for backgrounds */
export type GradientDirection =
  | 'to-bottom'
  | 'to-right'
  | 'to-bottom-right'
  | 'radial';

/** Gradient color stop */
export interface GradientStop {
  color: string;      // Hex color (#rrggbb)
  position: number;   // 0-100 percentage
}

/** Shape mask for images */
export type MaskShape =
  | { type: 'none' }
  | { type: 'circle' }
  | { type: 'rounded-rect'; radius: number };

/** Image metadata returned from analysis */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  channels: number;
  hasAlpha: boolean;
}

/** Result from image operations */
export interface ImageResult {
  buffer: Buffer;
  metadata: ImageMetadata;
}
```

## Function Template

Use this structure for all image processing functions:

```typescript
import sharp, { Sharp } from 'sharp';
import { logger } from '@bjj-poster/core';
import { ImageProcessingError, InvalidInputError } from './errors';
import type { Position, ImageMetadata } from './types';

interface FunctionNameOptions {
  // Define all options with JSDoc comments
  /** The source image to process */
  image: Sharp | Buffer;
  /** Output format */
  format?: 'png' | 'jpeg';
}

interface FunctionNameResult {
  // Define return shape
  buffer: Buffer;
  metadata: ImageMetadata;
}

/**
 * Brief description of what this function does.
 *
 * @param options - Configuration options
 * @returns Processed image buffer and metadata
 * @throws {InvalidInputError} When input validation fails
 * @throws {ImageProcessingError} When Sharp operation fails
 *
 * @example
 * ```typescript
 * const result = await functionName({
 *   image: inputBuffer,
 *   format: 'png',
 * });
 * ```
 */
export async function functionName(
  options: FunctionNameOptions
): Promise<FunctionNameResult> {
  const { image, format = 'png' } = options;

  logger.debug('functionName started', { format });

  try {
    // 1. Normalize input to Sharp instance
    const sharpInstance = Buffer.isBuffer(image) ? sharp(image) : image;

    // 2. Perform operations
    const processed = sharpInstance
      .toFormat(format);

    // 3. Generate output buffer
    const buffer = await processed.toBuffer();
    const metadata = await sharp(buffer).metadata();

    logger.debug('functionName completed', {
      width: metadata.width,
      height: metadata.height,
    });

    return {
      buffer,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
        format: metadata.format!,
        channels: metadata.channels!,
        hasAlpha: metadata.hasAlpha ?? false,
      },
    };
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }

    logger.error('functionName failed', { error });
    throw new ImageProcessingError(
      `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

## Error Classes

Define image-specific errors in `packages/core/src/image/errors.ts`:

```typescript
import { AppError } from '@bjj-poster/core';

/** Base error for all image processing failures */
export class ImageProcessingError extends AppError {
  constructor(message: string) {
    super(message, 500, 'IMAGE_PROCESSING_ERROR');
  }
}

/** Thrown when image input is invalid or corrupt */
export class InvalidInputError extends AppError {
  constructor(message: string) {
    super(message, 400, 'INVALID_IMAGE_INPUT');
  }
}

/** Thrown when a font cannot be loaded */
export class FontLoadError extends AppError {
  constructor(fontName: string) {
    super(`Failed to load font: ${fontName}`, 500, 'FONT_LOAD_ERROR');
  }
}

/** Thrown when a template is not found */
export class TemplateNotFoundError extends AppError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 404, 'TEMPLATE_NOT_FOUND');
  }
}

/** Thrown when template data is missing required fields */
export class MissingTemplateDataError extends AppError {
  constructor(missingFields: string[]) {
    super(
      `Missing required template fields: ${missingFields.join(', ')}`,
      400,
      'MISSING_TEMPLATE_DATA'
    );
  }
}
```

## Common Sharp.js Patterns

### Loading Images

```typescript
// From buffer
const img = sharp(buffer);

// From file path
const img = sharp('/path/to/image.jpg');

// From URL (fetch first)
const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
const img = sharp(buffer);
```

### Creating Solid Color Canvas

```typescript
const canvas = sharp({
  create: {
    width: 1080,
    height: 1350,
    channels: 4,
    background: { r: 26, g: 26, b: 46, alpha: 1 },
  },
});
```

### Creating Gradient Canvas (via SVG)

```typescript
const svg = `
  <svg width="${width}" height="${height}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
  </svg>
`;

const canvas = sharp(Buffer.from(svg));
```

### Compositing Images

```typescript
const result = await background
  .composite([
    {
      input: await overlayImage.toBuffer(),
      top: 100,
      left: 200,
      blend: 'over',
    },
    {
      input: await anotherImage.toBuffer(),
      gravity: 'center',
    },
  ])
  .toBuffer();
```

### Resizing with Aspect Ratio

```typescript
// Fit within 600x600, maintaining aspect ratio
const resized = await sharp(buffer)
  .resize(600, 600, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .toBuffer();
```

### Circular Mask

```typescript
const { width, height } = await sharp(buffer).metadata();
const radius = Math.min(width!, height!) / 2;

const circleMask = Buffer.from(
  `<svg width="${width}" height="${height}">
    <circle cx="${width! / 2}" cy="${height! / 2}" r="${radius}" fill="white"/>
  </svg>`
);

const masked = await sharp(buffer)
  .composite([{
    input: circleMask,
    blend: 'dest-in',
  }])
  .png() // Must output PNG for transparency
  .toBuffer();
```

### Adding Text via SVG

```typescript
const textSvg = `
  <svg width="${width}" height="${height}">
    <style>
      .title {
        font-family: 'Oswald';
        font-size: 64px;
        fill: white;
        font-weight: bold;
      }
    </style>
    <text x="50%" y="100" text-anchor="middle" class="title">
      ATHLETE NAME
    </text>
  </svg>
`;

const withText = await background
  .composite([{
    input: Buffer.from(textSvg),
    top: 0,
    left: 0,
  }])
  .toBuffer();
```

### Drop Shadow Effect

```typescript
// Create shadow by blurring a dark copy
const shadow = await sharp(imageBuffer)
  .modulate({ brightness: 0 }) // Make black
  .blur(20)
  .toBuffer();

const withShadow = await sharp({
  create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([
    { input: shadow, top: 10, left: 10 },  // Shadow offset
    { input: imageBuffer, top: 0, left: 0 },
  ])
  .toBuffer();
```

## Testing Pattern

Create visual snapshot tests for image functions:

```typescript
// packages/core/src/image/__tests__/composite.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { compositeImage } from '../composite';

const SNAPSHOTS_DIR = path.join(__dirname, '__snapshots__');
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

// Set to true to update snapshots
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

beforeAll(async () => {
  if (!existsSync(SNAPSHOTS_DIR)) {
    await mkdir(SNAPSHOTS_DIR, { recursive: true });
  }
});

async function compareToSnapshot(
  result: Buffer,
  snapshotName: string
): Promise<void> {
  const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotName}.png`);

  if (UPDATE_SNAPSHOTS || !existsSync(snapshotPath)) {
    await writeFile(snapshotPath, result);
    return;
  }

  const snapshot = await readFile(snapshotPath);

  // Compare pixel data
  const resultMeta = await sharp(result).raw().toBuffer({ resolveWithObject: true });
  const snapshotMeta = await sharp(snapshot).raw().toBuffer({ resolveWithObject: true });

  // Allow small differences (anti-aliasing, compression)
  const diffPixels = countDifferentPixels(resultMeta.data, snapshotMeta.data);
  const totalPixels = resultMeta.info.width * resultMeta.info.height;
  const diffPercent = (diffPixels / totalPixels) * 100;

  expect(diffPercent).toBeLessThan(1); // Less than 1% different
}

function countDifferentPixels(a: Buffer, b: Buffer, threshold = 10): number {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > threshold) diff++;
  }
  return diff / 4; // 4 channels (RGBA)
}

describe('compositeImage', () => {
  it('composites photo at center position', async () => {
    const background = await readFile(path.join(FIXTURES_DIR, 'background.png'));
    const photo = await readFile(path.join(FIXTURES_DIR, 'athlete.png'));

    const result = await compositeImage({
      background: sharp(background),
      layers: [{
        image: photo,
        position: 'center',
      }],
    });

    await compareToSnapshot(result.buffer, 'composite-center');
  });

  it('applies circle mask to photo', async () => {
    const background = await readFile(path.join(FIXTURES_DIR, 'background.png'));
    const photo = await readFile(path.join(FIXTURES_DIR, 'athlete.png'));

    const result = await compositeImage({
      background: sharp(background),
      layers: [{
        image: photo,
        position: 'center',
        mask: { type: 'circle' },
      }],
    });

    await compareToSnapshot(result.buffer, 'composite-circle-mask');
  });
});
```

### Test Fixtures

Store test images in `packages/core/src/image/__tests__/__fixtures__/`:

```
__fixtures__/
├── athlete.png       # Sample athlete photo (400x400)
├── background.png    # Sample background (1080x1350)
└── sample-output.png # Expected output for reference
```

Create simple fixtures programmatically if needed:

```typescript
// scripts/create-test-fixtures.ts
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';

async function createFixtures() {
  await mkdir('packages/core/src/image/__tests__/__fixtures__', { recursive: true });

  // Create a simple background
  const background = await sharp({
    create: {
      width: 1080,
      height: 1350,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  await writeFile(
    'packages/core/src/image/__tests__/__fixtures__/background.png',
    background
  );

  // Create a simple "athlete" placeholder (red square)
  const athlete = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 200, g: 50, b: 50, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  await writeFile(
    'packages/core/src/image/__tests__/__fixtures__/athlete.png',
    athlete
  );
}

createFixtures();
```

## Performance Tips

1. **Reuse Sharp instances** - Don't recreate from buffer if you already have a Sharp instance
2. **Use streams for large files** - `sharp().pipe()` instead of `toBuffer()` for memory efficiency
3. **Limit concurrent operations** - Sharp uses libvips thread pool; too many concurrent ops can thrash
4. **Choose output format wisely**:
   - PNG: Transparency needed, lossless
   - JPEG: Photos, smaller size, no transparency
   - WebP: Best compression, modern browsers only

```typescript
// Good: Chain operations
const result = await sharp(input)
  .resize(600, 600)
  .composite([...layers])
  .png()
  .toBuffer();

// Bad: Multiple round-trips
const resized = await sharp(input).resize(600, 600).toBuffer();
const composited = await sharp(resized).composite([...layers]).toBuffer();
const final = await sharp(composited).png().toBuffer();
```

## Checklist

When creating image processing functions:

- [ ] Uses shared types from `types.ts`
- [ ] Has JSDoc with `@param`, `@returns`, `@throws`, `@example`
- [ ] Throws appropriate error classes (not generic Error)
- [ ] Logs debug info at start and end of operation
- [ ] Has unit tests with visual snapshots
- [ ] Handles both Buffer and Sharp instance inputs
- [ ] Returns both buffer and metadata
- [ ] Documented in function's JSDoc with example usage
