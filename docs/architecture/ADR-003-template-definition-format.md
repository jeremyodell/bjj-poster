# ADR-003: Template Definition Format

**Status:** Accepted
**Date:** 2025-01-05
**Decision Makers:** Technical Lead, Team
**Stakeholders:** Backend developers, Frontend developers, Designers

---

## Context

Poster templates define the visual layout, styling, and composition rules for generating BJJ tournament posters. We need a format that:

1. **Designers can create** - Non-developers should be able to design templates
2. **Developers can extend** - Technical team can add complex logic when needed
3. **Frontend can preview** - Templates must be renderable in the browser before generation
4. **Backend can execute** - Lambda functions can use templates to composite images with Sharp.js
5. **Version control friendly** - Templates should be diffable and reviewable in git

### Options Considered

#### Option 1: Code-based Templates (TypeScript Classes)
```typescript
class TournamentTemplate extends BaseTemplate {
  render(data: PosterData): ImageComposition {
    // Imperative code
  }
}
```

#### Option 2: JSON Configuration
```json
{
  "id": "tournament-classic",
  "layout": {
    "background": { "type": "pregenerated" },
    "layers": [...]
  }
}
```

#### Option 3: Declarative DSL (Custom Format)
```yaml
template: tournament-classic
background: pregenerated-pool
layers:
  - type: photo
    position: [100, 100]
```

---

## Decision

**We will use JSON-based template definitions stored in DynamoDB, with TypeScript interfaces for type safety.**

Templates will be:
- **Defined in JSON** for designer accessibility
- **Typed with TypeScript interfaces** for developer safety
- **Stored in DynamoDB** with the single-table design pattern
- **Seeded from JSON files** in the repository for version control
- **Cacheable** in Lambda memory for performance

---

## Rationale

| Factor | JSON Config | Code-based | Custom DSL |
|--------|-------------|------------|------------|
| **Designer-friendly** | ✅ Visual editor possible | ❌ Requires coding | ⚠️ New syntax to learn |
| **Type safety** | ✅ Via TS interfaces | ✅✅ Native TS | ⚠️ Custom tooling |
| **Version control** | ✅ Clean diffs | ⚠️ Code changes | ✅ Text-based |
| **Frontend/backend sharing** | ✅ Same JSON | ❌ Need serialization | ⚠️ Parser needed |
| **Extensibility** | ⚠️ Limited logic | ✅ Full power | ⚠️ Limited by DSL |
| **Learning curve** | ✅ Familiar format | ⚠️ OOP patterns | ❌ New language |
| **Validation** | ✅ JSON Schema | ✅ TypeScript | ❌ Custom validator |

**JSON provides the best balance of accessibility, type safety, and cross-environment compatibility.**

---

## Template Schema

### TypeScript Interface

```typescript
// packages/core/src/types/template.ts

/**
 * Position in pixels from top-left corner
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Dimensions in pixels
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Rectangle defined by position and size
 */
export interface Rect extends Position, Dimensions {}

/**
 * Text styling options
 */
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string; // Hex color
  align?: 'left' | 'center' | 'right';
  opacity?: number; // 0-1
  strokeColor?: string;
  strokeWidth?: number;
  letterSpacing?: number;
  lineHeight?: number;
}

/**
 * Layer types that can be composited
 */
export type LayerType =
  | 'background'
  | 'photo'
  | 'text'
  | 'shape'
  | 'overlay';

/**
 * Background layer configuration
 */
export interface BackgroundLayer {
  type: 'background';
  strategy: 'pregenerated' | 'custom-ai' | 'solid-color' | 'gradient';

  // For pregenerated: randomly select from this pool
  pool?: string[]; // S3 keys

  // For custom-ai: Bedrock prompt template with {variable} placeholders
  promptTemplate?: string;

  // For solid-color
  color?: string;

  // For gradient
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number; // degrees, for linear
  };
}

/**
 * Photo layer configuration (athlete image)
 */
export interface PhotoLayer {
  type: 'photo';
  source: 'athlete-photo'; // Data binding key
  rect: Rect;

  // Image processing
  effects?: {
    removeBackground?: boolean;
    borderRadius?: number;
    border?: {
      width: number;
      color: string;
    };
    shadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
    };
    grayscale?: boolean;
    opacity?: number;
  };
}

/**
 * Text layer configuration
 */
export interface TextLayer {
  type: 'text';
  source: string; // Data binding key: 'athleteName', 'tournament', etc.
  rect: Rect;
  style: TextStyle;

  // Text transformations
  transform?: 'uppercase' | 'lowercase' | 'capitalize';
  maxLength?: number;
  fallback?: string; // Default text if source is empty
}

/**
 * Shape layer configuration
 */
export interface ShapeLayer {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'line';
  rect: Rect;
  fill?: string;
  stroke?: {
    color: string;
    width: number;
  };
  opacity?: number;
}

/**
 * Overlay layer (decorative image)
 */
export interface OverlayLayer {
  type: 'overlay';
  source: string; // S3 key to overlay image (logos, decorations)
  rect: Rect;
  opacity?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

/**
 * Union of all layer types
 */
export type Layer =
  | BackgroundLayer
  | PhotoLayer
  | TextLayer
  | ShapeLayer
  | OverlayLayer;

/**
 * Complete template definition
 */
export interface PosterTemplate {
  // Metadata
  id: string;
  name: string;
  description: string;
  category: 'tournament' | 'training' | 'promotion' | 'social';
  tags: string[];

  // Output configuration
  output: {
    width: number; // pixels
    height: number; // pixels
    format: 'png' | 'jpeg';
    quality?: number; // 1-100 for JPEG
  };

  // Required data fields
  requiredFields: Array<
    | 'athleteName'
    | 'belt'
    | 'team'
    | 'tournament'
    | 'date'
    | 'location'
    | 'division'
    | 'achievement'
  >;

  // Layer stack (rendered bottom-to-top)
  layers: Layer[];

  // Subscription tier requirement
  minimumTier: 'free' | 'pro' | 'premium';

  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

### Example Template (JSON)

```json
// packages/db/src/seed-data/templates/tournament-classic.json
{
  "id": "tournament-classic",
  "name": "Tournament Classic",
  "description": "Clean, professional tournament poster with centered athlete photo",
  "category": "tournament",
  "tags": ["professional", "tournament", "centered"],

  "output": {
    "width": 1080,
    "height": 1350,
    "format": "png"
  },

  "requiredFields": ["athleteName", "belt", "team", "tournament", "date"],

  "layers": [
    {
      "type": "background",
      "strategy": "pregenerated",
      "pool": [
        "backgrounds/tournament-arena-1.png",
        "backgrounds/tournament-arena-2.png",
        "backgrounds/tournament-arena-3.png"
      ]
    },
    {
      "type": "shape",
      "shape": "rectangle",
      "rect": { "x": 0, "y": 0, "width": 1080, "height": 300 },
      "fill": "#000000",
      "opacity": 0.7
    },
    {
      "type": "text",
      "source": "tournament",
      "rect": { "x": 540, "y": 80, "width": 900, "height": 100 },
      "style": {
        "fontFamily": "Bebas Neue",
        "fontSize": 72,
        "fontWeight": "bold",
        "color": "#FFFFFF",
        "align": "center",
        "strokeColor": "#000000",
        "strokeWidth": 2
      },
      "transform": "uppercase"
    },
    {
      "type": "text",
      "source": "date",
      "rect": { "x": 540, "y": 180, "width": 900, "height": 50 },
      "style": {
        "fontFamily": "Roboto",
        "fontSize": 36,
        "color": "#FFD700",
        "align": "center"
      }
    },
    {
      "type": "photo",
      "source": "athlete-photo",
      "rect": { "x": 240, "y": 350, "width": 600, "height": 600 },
      "effects": {
        "removeBackground": true,
        "border": {
          "width": 8,
          "color": "#FFD700"
        },
        "shadow": {
          "offsetX": 0,
          "offsetY": 10,
          "blur": 30,
          "color": "#00000080"
        }
      }
    },
    {
      "type": "shape",
      "shape": "rectangle",
      "rect": { "x": 0, "y": 1050, "width": 1080, "height": 300 },
      "fill": "#000000",
      "opacity": 0.8
    },
    {
      "type": "text",
      "source": "athleteName",
      "rect": { "x": 540, "y": 1100, "width": 900, "height": 80 },
      "style": {
        "fontFamily": "Bebas Neue",
        "fontSize": 64,
        "fontWeight": "bold",
        "color": "#FFFFFF",
        "align": "center"
      },
      "transform": "uppercase"
    },
    {
      "type": "text",
      "source": "belt",
      "rect": { "x": 540, "y": 1200, "width": 900, "height": 50 },
      "style": {
        "fontFamily": "Roboto",
        "fontSize": 36,
        "color": "#FFD700",
        "align": "center"
      },
      "transform": "capitalize"
    },
    {
      "type": "text",
      "source": "team",
      "rect": { "x": 540, "y": 1270, "width": 900, "height": 40 },
      "style": {
        "fontFamily": "Roboto",
        "fontSize": 28,
        "color": "#CCCCCC",
        "align": "center"
      }
    }
  ],

  "minimumTier": "free",
  "createdAt": "2025-01-05T00:00:00Z",
  "updatedAt": "2025-01-05T00:00:00Z",
  "version": 1
}
```

---

## Implementation Guide

### 1. Seeding Templates to DynamoDB

```typescript
// scripts/seed-templates.ts
import { dynamoClient } from '@bjj-poster/db';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(__dirname, '../packages/db/src/seed-data/templates');

async function seedTemplates() {
  const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));

  console.log(`Seeding ${files.length} templates...`);

  for (const file of files) {
    const templateJson = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
    const template = JSON.parse(templateJson);

    await dynamoClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME!,
      Item: {
        PK: 'TEMPLATE',
        SK: `${template.category}#${template.id}`,
        ...template,
      },
    }));

    console.log(`✓ Seeded template: ${template.name} (${template.id})`);
  }

  console.log('✅ Template seeding complete!');
}

seedTemplates().catch(console.error);
```

### 2. Template Repository

```typescript
// packages/db/src/repositories/template-repository.ts
import { dynamoClient } from '../client';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PosterTemplate } from '@bjj-poster/core';

export async function listTemplates(category?: string): Promise<PosterTemplate[]> {
  const params = category
    ? {
        TableName: process.env.TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :category)',
        ExpressionAttributeValues: {
          ':pk': 'TEMPLATE',
          ':category': category,
        },
      }
    : {
        TableName: process.env.TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'TEMPLATE',
        },
      };

  const result = await dynamoClient.send(new QueryCommand(params));
  return (result.Items || []) as PosterTemplate[];
}

export async function getTemplateById(templateId: string): Promise<PosterTemplate | null> {
  // Templates are stored with SK pattern: {category}#{id}
  // We need to query all templates and find by ID (since we don't know category)
  const allTemplates = await listTemplates();
  return allTemplates.find(t => t.id === templateId) || null;
}
```

### 3. Template Rendering Engine

```typescript
// packages/core/src/image-composition/renderer.ts
import sharp from 'sharp';
import { PosterTemplate, Layer, PhotoLayer, TextLayer } from '../types/template';

interface RenderData {
  athleteName: string;
  belt: string;
  team: string;
  tournament: string;
  date: string;
  location?: string;
  athletePhotoUrl: string;
}

export async function renderTemplate(
  template: PosterTemplate,
  data: RenderData
): Promise<Buffer> {
  // Create base canvas
  let canvas = sharp({
    create: {
      width: template.output.width,
      height: template.output.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });

  const composites: sharp.OverlayOptions[] = [];

  // Render each layer
  for (const layer of template.layers) {
    switch (layer.type) {
      case 'background':
        const bgBuffer = await renderBackgroundLayer(layer, data);
        composites.push({ input: bgBuffer, top: 0, left: 0 });
        break;

      case 'photo':
        const photoBuffer = await renderPhotoLayer(layer as PhotoLayer, data);
        composites.push({
          input: photoBuffer,
          top: layer.rect.y,
          left: layer.rect.x,
        });
        break;

      case 'text':
        const textBuffer = await renderTextLayer(layer as TextLayer, data);
        composites.push({
          input: textBuffer,
          top: layer.rect.y,
          left: layer.rect.x,
        });
        break;

      case 'shape':
        const shapeBuffer = await renderShapeLayer(layer);
        composites.push({
          input: shapeBuffer,
          top: layer.rect.y,
          left: layer.rect.x,
        });
        break;

      case 'overlay':
        const overlayBuffer = await renderOverlayLayer(layer);
        composites.push({
          input: overlayBuffer,
          top: layer.rect.y,
          left: layer.rect.x,
        });
        break;
    }
  }

  // Composite all layers
  canvas = canvas.composite(composites);

  // Output format
  const outputBuffer = await canvas
    [template.output.format](
      template.output.quality ? { quality: template.output.quality } : {}
    )
    .toBuffer();

  return outputBuffer;
}

async function renderTextLayer(layer: TextLayer, data: RenderData): Promise<Buffer> {
  // Get text from data binding
  let text = data[layer.source as keyof RenderData] || layer.fallback || '';

  // Apply transformations
  if (layer.transform === 'uppercase') text = text.toUpperCase();
  if (layer.transform === 'lowercase') text = text.toLowerCase();
  if (layer.transform === 'capitalize') text = text.charAt(0).toUpperCase() + text.slice(1);

  // Truncate if needed
  if (layer.maxLength && text.length > layer.maxLength) {
    text = text.slice(0, layer.maxLength) + '...';
  }

  // Use sharp's text rendering (requires libvips with text support)
  // Or use canvas/node-canvas for more advanced text rendering
  const svg = `
    <svg width="${layer.rect.width}" height="${layer.rect.height}">
      <text
        x="${layer.style.align === 'center' ? '50%' : '0'}"
        y="50%"
        text-anchor="${layer.style.align || 'left'}"
        dominant-baseline="middle"
        font-family="${layer.style.fontFamily}"
        font-size="${layer.style.fontSize}"
        font-weight="${layer.style.fontWeight || 'normal'}"
        fill="${layer.style.color}"
        opacity="${layer.style.opacity || 1}"
        ${layer.style.strokeColor ? `stroke="${layer.style.strokeColor}" stroke-width="${layer.style.strokeWidth}"` : ''}
      >
        ${text}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

// Similar functions for renderPhotoLayer, renderShapeLayer, etc.
```

---

## Consequences

### Positive

✅ **Designer accessibility** - Non-developers can create templates with JSON editor
✅ **Type safety** - TypeScript interfaces catch errors at compile time
✅ **Version control** - JSON files in git enable tracking changes, code review
✅ **Cross-platform** - Same JSON works in frontend preview and backend rendering
✅ **Extensibility** - Can add new layer types without breaking existing templates
✅ **Validation** - JSON Schema can validate templates before deployment
✅ **Caching** - Templates can be loaded once and cached in Lambda memory

### Negative

❌ **Limited logic** - Complex conditional layouts require code changes
❌ **Verbose** - JSON is wordier than code for simple layouts
❌ **No computation** - Can't calculate positions dynamically (e.g., "center text")
❌ **Font management** - Need to bundle fonts or use web-safe fonts only

### Neutral

⚠️ **Schema evolution** - Need migration strategy when template format changes
⚠️ **Preview accuracy** - Frontend preview must match backend rendering exactly

---

## Future Enhancements

### 1. Visual Template Editor (Post-MVP)

Build a web-based template editor:
- Drag-and-drop layer positioning
- Live preview with sample data
- Export to JSON format
- Import existing templates

### 2. Template Marketplace (Long-term)

Allow users to:
- Upload custom templates
- Share templates with community
- Purchase premium templates from designers

### 3. Dynamic Layouts (Advanced)

Add expression language for computed values:
```json
{
  "rect": {
    "x": "{{ (canvasWidth - photoWidth) / 2 }}",
    "y": 350,
    "width": "{{ photoWidth }}",
    "height": "{{ photoHeight }}"
  }
}
```

---

## References

- [Sharp.js Documentation](https://sharp.pixelplumbing.com/)
- [JSON Schema Specification](https://json-schema.org/)
- [Figma Plugin API](https://www.figma.com/plugin-docs/) - Inspiration for layer-based model
- [Canva Design API](https://www.canva.dev/) - Template marketplace reference

---

## Review History

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| 2025-01-05 | Team | Accepted | JSON-based templates with TS interfaces |
