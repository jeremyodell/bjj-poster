import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTemplate,
  loadTemplate,
  listTemplates,
  clearTemplates,
} from '../../image/template.js';
import { initBundledTemplates, classicTemplate, modernTemplate, bundledTemplateIds } from '../index.js';

describe('bundled templates', () => {
  beforeEach(() => {
    clearTemplates();
  });

  describe('initBundledTemplates', () => {
    it('registers all bundled templates', () => {
      initBundledTemplates();
      const templates = listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(2);
    });

    it('can be called multiple times without error', () => {
      initBundledTemplates();
      initBundledTemplates();
      const templates = listTemplates();
      expect(templates.length).toBe(2);
    });
  });

  describe('classicTemplate', () => {
    it('passes validation', () => {
      const result = validateTemplate(classicTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('has correct id', () => {
      expect(classicTemplate.id).toBe('classic');
    });

    it('has correct canvas dimensions (Instagram portrait)', () => {
      expect(classicTemplate.canvas.width).toBe(1080);
      expect(classicTemplate.canvas.height).toBe(1350);
    });

    it('has gradient background', () => {
      expect(classicTemplate.background.type).toBe('gradient');
    });

    it('has athletePhoto field', () => {
      const photoField = classicTemplate.photos.find((p) => p.id === 'athletePhoto');
      expect(photoField).toBeDefined();
      expect(photoField?.mask?.type).toBe('circle');
      expect(photoField?.border).toBeDefined();
      expect(photoField?.shadow).toBeDefined();
    });

    it('has required text fields', () => {
      const textIds = classicTemplate.text.map((t) => t.id);
      expect(textIds).toContain('athleteName');
      expect(textIds).toContain('tournament');
      expect(textIds).toContain('beltRank');
      expect(textIds).toContain('date');
      expect(textIds).toContain('location');
    });

    it('can be loaded after initialization', () => {
      initBundledTemplates();
      const loaded = loadTemplate('classic');
      expect(loaded).toEqual(classicTemplate);
    });
  });

  describe('modernTemplate', () => {
    it('passes validation', () => {
      const result = validateTemplate(modernTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('has correct id', () => {
      expect(modernTemplate.id).toBe('modern');
    });

    it('has correct canvas dimensions', () => {
      expect(modernTemplate.canvas.width).toBe(1080);
      expect(modernTemplate.canvas.height).toBe(1350);
    });

    it('has radial gradient background', () => {
      expect(modernTemplate.background.type).toBe('gradient');
      if (modernTemplate.background.type === 'gradient') {
        expect(modernTemplate.background.direction).toBe('radial');
      }
    });

    it('has athletePhoto field with rounded-rect mask', () => {
      const photoField = modernTemplate.photos.find((p) => p.id === 'athletePhoto');
      expect(photoField).toBeDefined();
      expect(photoField?.mask?.type).toBe('rounded-rect');
    });

    it('has text with stroke effects', () => {
      const athleteName = modernTemplate.text.find((t) => t.id === 'athleteName');
      expect(athleteName?.style.stroke).toBeDefined();
    });

    it('has required text fields', () => {
      const textIds = modernTemplate.text.map((t) => t.id);
      expect(textIds).toContain('athleteName');
      expect(textIds).toContain('tournament');
      expect(textIds).toContain('beltRank');
    });

    it('can be loaded after initialization', () => {
      initBundledTemplates();
      const loaded = loadTemplate('modern');
      expect(loaded).toEqual(modernTemplate);
    });
  });

  describe('bundledTemplateIds', () => {
    it('contains all bundled template IDs', () => {
      expect(bundledTemplateIds).toContain('classic');
      expect(bundledTemplateIds).toContain('modern');
    });

    it('matches actual bundled templates', () => {
      initBundledTemplates();
      const registeredIds = listTemplates().map((t) => t.id);
      for (const id of bundledTemplateIds) {
        expect(registeredIds).toContain(id);
      }
    });
  });
});
