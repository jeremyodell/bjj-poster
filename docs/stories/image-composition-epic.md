# Epic: Image Composition Engine

**Epic ID:** IMG
**Priority:** High
**Target:** Junior Developer Onboarding
**Estimated Stories:** 6

---

## Overview

Build the core image composition engine that combines athlete photos, text overlays, and template backgrounds into tournament posters. This epic is designed as a junior developer learning path—each story builds on the previous one and produces visible, satisfying results.

### Why This Epic First?

- **Immediate visual feedback** — Every change produces a viewable image
- **Self-contained** — No AWS infrastructure dependencies
- **Core business value** — This IS the product's main feature
- **Reusable foundation** — Becomes the heart of the ProcessPoster Lambda

### Technical Context

- **Library:** Sharp.js (high-performance Node.js image processing)
- **Location:** `packages/core/src/image/`
- **Testing:** Unit tests with snapshot comparisons
- **Output:** PNG and JPEG buffers

---

## Story: IMG-001

### Set Up Sharp.js and Create Basic Image Loader

**Type:** Task
**Points:** 2
**Depends On:** None

#### Description

As a developer, I need to set up the Sharp.js library and create utility functions to load images from various sources (file path, URL, Buffer) so that subsequent stories have a foundation to build on.

#### Acceptance Criteria

- [ ] Sharp.js is installed in `packages/core`
- [ ] `loadImage()` function accepts a file path and returns a Sharp instance
- [ ] `loadImage()` function accepts a Buffer and returns a Sharp instance
- [ ] `loadImage()` function accepts a URL and returns a Sharp instance (using fetch)
- [ ] `getImageMetadata()` function returns width, height, and format of an image
- [ ] All functions have proper TypeScript types
- [ ] Unit tests cover all three input types
- [ ] Error handling for invalid/corrupt images with descriptive error messages

#### Technical Notes

```typescript
// packages/core/src/image/loader.ts

import sharp, { Sharp } from 'sharp';

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

/**
 * Load an image from various sources
 * @param source - File path, URL, or Buffer
 * @returns Sharp instance for further processing
 */
export async function loadImage(source: string | Buffer): Promise<Sharp>;

/**
 * Get metadata about an image
 * @param source - File path, URL, or Buffer
 * @returns Image dimensions and format
 */
export async function getImageMetadata(source: string | Buffer): Promise<ImageMetadata>;
```

#### Test Cases

1. Load image from local file path → returns Sharp instance
2. Load image from Buffer → returns Sharp instance
3. Load image from HTTPS URL → returns Sharp instance
4. Load corrupt/invalid file → throws descriptive error
5. Load non-existent file → throws descriptive error
6. Get metadata returns correct dimensions for known test image

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] TypeScript strict mode passes
- [ ] Functions exported from `packages/core` barrel file

---

## Story: IMG-002

### Create Background Canvas with Solid Colors and Gradients

**Type:** Feature
**Points:** 3
**Depends On:** IMG-001

#### Description

As a developer, I need to create background canvases of specific dimensions with solid colors or gradients so that posters have a base layer to build upon.

#### Acceptance Criteria

- [ ] `createCanvas()` function creates a blank canvas of specified dimensions
- [ ] Canvas can be filled with a solid hex color (e.g., `#1a1a1a`)
- [ ] Canvas can be filled with a linear gradient (top-to-bottom, left-to-right)
- [ ] Canvas can be filled with a radial gradient
- [ ] Gradient supports 2-4 color stops
- [ ] Output can be PNG or JPEG buffer
- [ ] Unit tests with visual snapshot comparisons

#### Technical Notes

```typescript
// packages/core/src/image/canvas.ts

type GradientDirection = 'to-bottom' | 'to-right' | 'to-bottom-right' | 'radial';

interface GradientStop {
  color: string;      // Hex color
  position: number;   // 0-100 percentage
}

interface CanvasOptions {
  width: number;
  height: number;
  fill:
    | { type: 'solid'; color: string }
    | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] };
}

/**
 * Create a canvas with solid color or gradient background
 */
export async function createCanvas(options: CanvasOptions): Promise<Sharp>;
```

#### Visual Examples

```
Solid:           Linear Gradient:      Radial Gradient:
┌──────────┐     ┌──────────┐         ┌──────────┐
│ #1a1a1a  │     │  Dark    │         │  ○ Light │
│          │     │    ↓     │         │ ↙     ↘  │
│          │     │  Light   │         │Dark  Dark│
└──────────┘     └──────────┘         └──────────┘
```

#### Test Cases

1. Create 1080x1350 canvas with solid black → correct dimensions
2. Create canvas with hex color `#ff5733` → correct color in output
3. Create vertical gradient dark→light → visual snapshot matches
4. Create horizontal gradient → visual snapshot matches
5. Create radial gradient with 3 stops → visual snapshot matches
6. Invalid hex color → throws descriptive error

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing including visual snapshots
- [ ] Example gradient outputs saved in `docs/examples/`

---

## Story: IMG-003

### Composite Athlete Photo onto Background

**Type:** Feature
**Points:** 5
**Depends On:** IMG-001, IMG-002

#### Description

As a developer, I need to composite an athlete's photo onto a background canvas with configurable positioning, sizing, and masking so that the athlete appears professionally placed on the poster.

#### Acceptance Criteria

- [ ] `compositeImage()` places one image on top of another
- [ ] Position can be specified as x/y pixels or named positions (center, bottom-center, etc.)
- [ ] Athlete photo can be resized to fit within specified bounds (maintaining aspect ratio)
- [ ] Athlete photo can be cropped to a circle or rounded rectangle mask
- [ ] Athlete photo can have a border/stroke added
- [ ] Athlete photo can have a drop shadow
- [ ] Multiple images can be composited in a single operation
- [ ] Unit tests verify positioning math and visual output

#### Technical Notes

```typescript
// packages/core/src/image/composite.ts

type Position =
  | { x: number; y: number }
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';

type MaskShape =
  | { type: 'none' }
  | { type: 'circle' }
  | { type: 'rounded-rect'; radius: number };

interface CompositeLayer {
  image: Sharp | Buffer;
  position: Position;
  size?: { width: number; height?: number } | { height: number; width?: number };
  mask?: MaskShape;
  border?: { width: number; color: string };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
  opacity?: number;  // 0-1
}

interface CompositeOptions {
  background: Sharp;
  layers: CompositeLayer[];
}

/**
 * Composite multiple layers onto a background
 */
export async function compositeImage(options: CompositeOptions): Promise<Sharp>;
```

#### Visual Examples

```
Input:                    Output:
┌─────────┐              ┌─────────────────┐
│ Athlete │              │   Tournament    │
│  Photo  │      +       │    ┌─────┐      │
└─────────┘              │    │Photo│      │
┌─────────────────┐      │    └─────┘      │
│   Background    │      │                 │
└─────────────────┘      └─────────────────┘

With circle mask:         With shadow:
    ┌───┐                    ┌───┐░
    │ ○ │                    │   │░
    └───┘                    └───┘░
                              ░░░░░
```

#### Test Cases

1. Composite photo at center → photo centered on canvas
2. Composite photo at bottom-center → photo at bottom, horizontally centered
3. Composite photo at x:100, y:200 → exact pixel positioning
4. Resize photo to width:400 → maintains aspect ratio
5. Apply circle mask → photo cropped to circle
6. Apply rounded-rect mask with 20px radius → corners rounded
7. Add 4px white border → border visible around photo
8. Add drop shadow → shadow visible behind photo
9. Set opacity to 0.5 → photo is semi-transparent
10. Composite 3 layers → all layers visible in correct order

#### Edge Cases to Handle

- Photo larger than canvas → scale down to fit
- Photo smaller than target size → scale up (with quality warning log)
- Transparent PNG photo → transparency preserved
- JPEG photo (no alpha) → works correctly with masks

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing including visual snapshots
- [ ] Performance acceptable (< 500ms for typical poster size)
- [ ] Example outputs saved in `docs/examples/`

---

## Story: IMG-004

### Add Text Overlays with Custom Fonts and Styling

**Type:** Feature
**Points:** 5
**Depends On:** IMG-001

#### Description

As a developer, I need to add text overlays to images with custom fonts, colors, and effects so that athlete names, tournament details, and other information appear on the poster.

#### Acceptance Criteria

- [ ] `addText()` renders text onto an image at specified position
- [ ] Text supports custom fonts (loaded from .ttf/.otf files)
- [ ] Text supports size, color, and letter-spacing
- [ ] Text supports alignment (left, center, right)
- [ ] Text supports text-transform (uppercase, lowercase, capitalize)
- [ ] Text supports stroke/outline effect
- [ ] Text supports drop shadow effect
- [ ] Text can auto-size to fit within a maximum width
- [ ] Multiple text elements can be added in a single operation
- [ ] Fallback to system font if custom font not found (with warning)

#### Technical Notes

```typescript
// packages/core/src/image/text.ts

interface TextStyle {
  fontFamily: string;           // Font name or path to .ttf file
  fontSize: number;             // In pixels
  color: string;                // Hex color
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;       // In pixels
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  stroke?: { width: number; color: string };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
  maxWidth?: number;            // Auto-shrink font to fit
}

interface TextLayer {
  content: string;
  position: Position;
  style: TextStyle;
}

interface AddTextOptions {
  image: Sharp;
  layers: TextLayer[];
}

/**
 * Add text overlays to an image
 */
export async function addText(options: AddTextOptions): Promise<Sharp>;
```

#### Font Management

```typescript
// packages/core/src/image/fonts.ts

/**
 * Register a custom font for use in text rendering
 * @param name - Font family name to reference
 * @param path - Path to .ttf or .otf file
 */
export async function registerFont(name: string, path: string): Promise<void>;

/**
 * List all registered fonts
 */
export function listFonts(): string[];
```

#### Visual Examples

```
Basic text:              With stroke:            With shadow:
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│              │        │              │        │              │
│  JOHN DOE    │        │  JOHN DOE    │        │  JOHN DOE    │
│              │        │  (outlined)  │        │    ░░░░░     │
└──────────────┘        └──────────────┘        └──────────────┘
```

#### Test Cases

1. Render "Hello World" at center → text visible and centered
2. Render with custom .ttf font → correct font used
3. Render with 48px font size → correct size
4. Render with #ff0000 color → red text
5. Render with center alignment → text centered on x position
6. Render with uppercase transform → "hello" becomes "HELLO"
7. Render with 2px white stroke → outline visible
8. Render with shadow → shadow visible behind text
9. Render long text with maxWidth → font shrinks to fit
10. Render with missing font → falls back to system font with warning
11. Render multiple text layers → all layers visible

#### Bundled Fonts (for MVP)

Include 2-3 free fonts for immediate use:
- `Oswald-Bold.ttf` - Strong, sporty feel
- `Roboto-Regular.ttf` - Clean, readable
- `BebasNeue-Regular.ttf` - Bold headlines

Store in: `packages/core/assets/fonts/`

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing including visual snapshots
- [ ] At least 2 bundled fonts included
- [ ] Example outputs saved in `docs/examples/`

---

## Story: IMG-005

### Create Template Configuration System

**Type:** Feature
**Points:** 5
**Depends On:** IMG-002, IMG-003, IMG-004

#### Description

As a developer, I need a template configuration system that defines poster layouts (background, photo placement, text positions) so that multiple poster styles can be created without code changes.

#### Acceptance Criteria

- [ ] Templates are defined as JSON/TypeScript configuration objects
- [ ] Template defines canvas size and background (solid, gradient, or image)
- [ ] Template defines athlete photo position, size, and mask
- [ ] Template defines text fields with position and default styling
- [ ] Text fields are named (e.g., "athleteName", "tournament") for data binding
- [ ] Template can be validated against a schema
- [ ] At least 2 starter templates created ("classic", "modern")
- [ ] Templates stored in `packages/core/src/templates/`

#### Technical Notes

```typescript
// packages/core/src/image/template.ts

interface TemplateTextField {
  id: string;                    // e.g., "athleteName", "tournament"
  position: Position;
  style: TextStyle;
  placeholder?: string;          // Shown in previews
}

interface TemplatePhotoField {
  id: string;                    // e.g., "athletePhoto"
  position: Position;
  size: { width: number; height: number };
  mask?: MaskShape;
  border?: { width: number; color: string };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
}

interface PosterTemplate {
  id: string;
  name: string;
  description: string;
  version: string;

  canvas: {
    width: number;
    height: number;
  };

  background:
    | { type: 'solid'; color: string }
    | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] }
    | { type: 'image'; path: string };

  photos: TemplatePhotoField[];
  text: TemplateTextField[];
}

/**
 * Load a template by ID
 */
export async function loadTemplate(templateId: string): Promise<PosterTemplate>;

/**
 * Validate a template configuration
 */
export function validateTemplate(template: unknown): template is PosterTemplate;

/**
 * List all available templates
 */
export async function listTemplates(): Promise<Array<{ id: string; name: string }>>;
```

#### Example Template: "Classic"

```typescript
// packages/core/src/templates/classic.ts

export const classicTemplate: PosterTemplate = {
  id: 'classic',
  name: 'Classic Tournament',
  description: 'Traditional tournament poster with centered athlete photo',
  version: '1.0.0',

  canvas: {
    width: 1080,
    height: 1350,  // Instagram portrait
  },

  background: {
    type: 'gradient',
    direction: 'to-bottom',
    stops: [
      { color: '#1a1a2e', position: 0 },
      { color: '#16213e', position: 100 },
    ],
  },

  photos: [
    {
      id: 'athletePhoto',
      position: 'center',
      size: { width: 600, height: 600 },
      mask: { type: 'circle' },
      border: { width: 4, color: '#ffd700' },
      shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
    },
  ],

  text: [
    {
      id: 'athleteName',
      position: { x: 540, y: 950 },
      style: {
        fontFamily: 'Oswald-Bold',
        fontSize: 64,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'beltRank',
      position: { x: 540, y: 1020 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 32,
        color: '#ffd700',
        align: 'center',
      },
      placeholder: 'Black Belt',
    },
    {
      id: 'tournament',
      position: { x: 540, y: 150 },
      style: {
        fontFamily: 'BebasNeue-Regular',
        fontSize: 48,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 4,
      },
      placeholder: 'TOURNAMENT NAME',
    },
    {
      id: 'date',
      position: { x: 540, y: 1200 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 28,
        color: '#cccccc',
        align: 'center',
      },
      placeholder: 'January 1, 2025',
    },
    {
      id: 'location',
      position: { x: 540, y: 1240 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 24,
        color: '#999999',
        align: 'center',
      },
      placeholder: 'City, State',
    },
  ],
};
```

#### Test Cases

1. Load "classic" template → returns valid template object
2. Load non-existent template → throws descriptive error
3. Validate valid template → returns true
4. Validate template missing required field → returns false with error details
5. List templates → returns array with at least 2 templates

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] "classic" template created and tested
- [ ] "modern" template created and tested
- [ ] Template JSON schema documented

---

## Story: IMG-006

### Build Complete Poster Composition Function

**Type:** Feature
**Points:** 5
**Depends On:** IMG-003, IMG-004, IMG-005

#### Description

As a developer, I need a high-level function that takes athlete data, a photo, and a template ID, then produces a complete poster image so that the poster generation pipeline can use a single entry point.

#### Acceptance Criteria

- [ ] `composePoster()` accepts athlete data, photo buffer, and template ID
- [ ] Function loads the template and validates all required fields are provided
- [ ] Function creates background from template config
- [ ] Function composites athlete photo according to template
- [ ] Function renders all text fields with provided data
- [ ] Function returns final image as PNG or JPEG buffer
- [ ] Function accepts output options (format, quality, dimensions)
- [ ] Function provides progress callbacks for long operations
- [ ] Comprehensive error handling with actionable error messages
- [ ] Performance: completes in < 2 seconds for typical inputs

#### Technical Notes

```typescript
// packages/core/src/image/compose-poster.ts

interface AthleteData {
  athleteName: string;
  beltRank: string;
  team?: string;
  tournament: string;
  date: string;
  location: string;
  [key: string]: string | undefined;  // Allow additional fields
}

interface OutputOptions {
  format: 'png' | 'jpeg';
  quality?: number;        // 1-100 for JPEG
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
}

interface ComposePosterOptions {
  templateId: string;
  athletePhoto: Buffer;
  data: AthleteData;
  output?: OutputOptions;
  onProgress?: (stage: string, percent: number) => void;
}

interface ComposePosterResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;  // bytes
  };
}

/**
 * Compose a complete poster from template, photo, and data
 */
export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult>;
```

#### Example Usage

```typescript
import { composePoster } from '@bjj-poster/core';
import { readFile, writeFile } from 'fs/promises';

const athletePhoto = await readFile('./athlete.jpg');

const result = await composePoster({
  templateId: 'classic',
  athletePhoto,
  data: {
    athleteName: 'João Silva',
    beltRank: 'Black Belt - 2nd Degree',
    team: 'Gracie Barra',
    tournament: 'World Championship 2025',
    date: 'June 15, 2025',
    location: 'Las Vegas, NV',
  },
  output: {
    format: 'png',
  },
  onProgress: (stage, percent) => {
    console.log(`${stage}: ${percent}%`);
  },
});

await writeFile('./poster.png', result.buffer);
console.log(`Generated ${result.metadata.width}x${result.metadata.height} poster`);
```

#### Progress Stages

1. `loading-template` (0-10%)
2. `creating-background` (10-30%)
3. `processing-photo` (30-50%)
4. `compositing-photo` (50-70%)
5. `rendering-text` (70-90%)
6. `encoding-output` (90-100%)

#### Test Cases

1. Compose with valid inputs → returns PNG buffer
2. Compose with JPEG output → returns JPEG buffer
3. Compose with resize option → output matches requested dimensions
4. Compose with invalid template ID → throws descriptive error
5. Compose with missing required data field → throws error listing missing fields
6. Compose with corrupt photo → throws descriptive error
7. Compose with transparent PNG photo → transparency handled correctly
8. Progress callback called → all stages reported with increasing percentages
9. Performance test → completes in < 2 seconds

#### CLI Tool (Bonus)

Create a simple CLI for testing:

```bash
# packages/core/src/cli/compose.ts
pnpm compose --template classic --photo ./athlete.jpg --output ./poster.png \
  --name "João Silva" \
  --belt "Black Belt" \
  --tournament "Worlds 2025" \
  --date "June 15, 2025" \
  --location "Las Vegas, NV"
```

#### Definition of Done

- [ ] Code reviewed and approved
- [ ] All tests passing including visual snapshots
- [ ] Integration test with real photo produces valid poster
- [ ] Performance benchmark documented
- [ ] CLI tool working (if included)
- [ ] Function exported from `@bjj-poster/core` package

---

## Epic Summary

| Story | Title | Points | Depends On |
|-------|-------|--------|------------|
| IMG-001 | Set Up Sharp.js and Create Basic Image Loader | 2 | - |
| IMG-002 | Create Background Canvas with Solid Colors and Gradients | 3 | IMG-001 |
| IMG-003 | Composite Athlete Photo onto Background | 5 | IMG-001, IMG-002 |
| IMG-004 | Add Text Overlays with Custom Fonts and Styling | 5 | IMG-001 |
| IMG-005 | Create Template Configuration System | 5 | IMG-002, IMG-003, IMG-004 |
| IMG-006 | Build Complete Poster Composition Function | 5 | IMG-003, IMG-004, IMG-005 |

**Total Points:** 25
**Suggested Order:** IMG-001 → IMG-002 → IMG-004 → IMG-003 → IMG-005 → IMG-006

Note: IMG-003 and IMG-004 can be worked in parallel after IMG-001/IMG-002 are complete.

---

## Success Criteria for Epic

- [ ] Junior developer can run `pnpm test` and see all image tests pass
- [ ] Junior developer can run CLI tool to generate a sample poster
- [ ] Generated posters are visually professional quality
- [ ] Code follows project patterns (error classes, logging, types)
- [ ] All functions have JSDoc comments
- [ ] Visual examples exist in `docs/examples/`

---

## Resources

- [Sharp.js Documentation](https://sharp.pixelplumbing.com/)
- [SVG Text Rendering in Sharp](https://sharp.pixelplumbing.com/api-composite#text)
- [Google Fonts (for finding free fonts)](https://fonts.google.com/)
- [Canva BJJ Poster Examples (design inspiration)](https://www.canva.com/templates/s/bjj-poster/)
