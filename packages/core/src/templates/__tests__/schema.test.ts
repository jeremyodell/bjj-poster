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
