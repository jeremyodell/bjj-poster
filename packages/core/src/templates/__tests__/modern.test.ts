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
