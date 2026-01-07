# Poster Composition Function Design

**Issue:** ODE-10 - IMG-006: Build Complete Poster Composition Function
**Date:** 2026-01-07
**Status:** Approved

## Overview

High-level function that takes athlete data, a photo, and a template ID, then produces a complete poster image. Serves as the single entry point for the poster generation pipeline.

## Function Signature

```typescript
// packages/core/src/image/compose-poster.ts

interface ComposePosterOptions {
  /** Template ID to use (e.g., 'classic', 'modern') */
  templateId: string;
  /** Athlete photo as Buffer */
  athletePhoto: Buffer;
  /** Data keyed by template field IDs (e.g., { athleteName: "João", achievement: "Gold" }) */
  data: Record<string, string>;
  /** Output format options */
  output?: {
    format?: 'png' | 'jpeg';
    quality?: number;  // 1-100 for JPEG
    resize?: {
      width?: number;
      height?: number;
      fit?: 'contain' | 'cover' | 'fill';
    };
  };
  /** Progress callback */
  onProgress?: (stage: string, percent: number) => void;
}

interface ComposePosterResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult>;
```

## Design Decisions

### Data Binding
- **Decision:** Use template field IDs for data binding
- **Rationale:** More flexible - works with any template regardless of its field names. Data object uses field IDs from the template (e.g., `{ athleteName: "João", achievement: "Gold Medal" }`)

### Photo Input
- **Decision:** Single `athletePhoto` buffer for MVP
- **Rationale:** Matches ticket spec, simple API. Can extend to photo map later if multi-photo templates are needed.

### Position Conversion
- **Decision:** Create a centralized `convertTemplatePosition()` utility
- **Rationale:** Templates use anchor+offset positions, but existing image functions use x/y coordinates. A converter keeps logic centralized and testable.

### Progress Reporting
- **Decision:** Stage-based progress only
- **Rationale:** Simple to implement, avoids false precision. Reports at start of each stage.

### Field Validation
- **Decision:** All template fields are required
- **Rationale:** Simple rule - if the template defines a text field, data must be provided. Error lists all missing fields at once.

## Position Converter Utility

```typescript
// packages/core/src/image/position-utils.ts

import type { TemplatePosition } from '../templates/types.js';

interface CanvasSize {
  width: number;
  height: number;
}

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

## Composition Flow

| Stage | Percent | Operations |
|-------|---------|------------|
| loading-template | 0% | loadTemplate(), validate data fields |
| creating-background | 10% | createCanvas() with template background |
| processing-photo | 30% | Load/validate photo, resize to template size |
| compositing-photo | 50% | compositeImage() with mask, border, shadow |
| rendering-text | 70% | addText() for all template text fields |
| encoding-output | 90% | Convert to requested format, apply resize |

## Error Handling

| Error Class | When Thrown |
|-------------|-------------|
| TemplateNotFoundError | Template ID doesn't exist |
| ValidationError | Missing required data fields (lists all missing) |
| InvalidInputError | Corrupt photo buffer or invalid options |
| ImageProcessingError | Sharp operation failures |

## File Structure

```
packages/core/src/image/
├── compose-poster.ts           # Main composePoster() function
├── position-utils.ts           # convertTemplatePosition() utility
├── __tests__/
│   ├── compose-poster.test.ts  # Unit tests
│   └── position-utils.test.ts  # Position converter tests
└── index.ts                    # Export new functions
```

## Exports

Added to `packages/core/src/image/index.ts`:
```typescript
export { composePoster } from './compose-poster.js';
export type { ComposePosterOptions, ComposePosterResult } from './compose-poster.js';
export { convertTemplatePosition } from './position-utils.js';
```

## Example Usage

```typescript
import { composePoster, initBundledFonts } from '@bjj-poster/core';
import { readFile, writeFile } from 'fs/promises';

await initBundledFonts();

const athletePhoto = await readFile('./athlete.jpg');

const result = await composePoster({
  templateId: 'classic',
  athletePhoto,
  data: {
    athleteName: 'João Silva',
    achievement: 'Gold Medal',
    tournamentName: 'World Championship 2025',
    date: 'June 15, 2025',
  },
  output: { format: 'png' },
  onProgress: (stage, percent) => {
    console.log(`${stage}: ${percent}%`);
  },
});

await writeFile('./poster.png', result.buffer);
console.log(`Generated ${result.metadata.width}x${result.metadata.height} poster`);
```
