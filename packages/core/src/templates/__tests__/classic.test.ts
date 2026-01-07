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
