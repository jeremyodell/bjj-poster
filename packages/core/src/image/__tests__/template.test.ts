import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTemplate,
  isValidTemplate,
  registerTemplate,
  loadTemplate,
  isTemplateRegistered,
  listTemplates,
  getAllTemplates,
  clearTemplates,
} from '../template.js';
import { TemplateNotFoundError, TemplateValidationError } from '../errors.js';
import type { PosterTemplate } from '../types.js';

// Valid minimal template for testing
const validTemplate: PosterTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A template for testing',
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
      position: 'center',
      size: { width: 400, height: 400 },
    },
  ],
  text: [
    {
      id: 'athleteName',
      position: { x: 540, y: 800 },
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        color: '#ffffff',
      },
      placeholder: 'Athlete Name',
    },
  ],
};

describe('validateTemplate', () => {
  it('returns valid for a correct template', () => {
    const result = validateTemplate(validTemplate);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for non-object', () => {
    const result = validateTemplate('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template must be an object');
  });

  it('returns invalid for null', () => {
    const result = validateTemplate(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template must be an object');
  });

  describe('required fields', () => {
    it('requires id to be a non-empty string', () => {
      const template = { ...validTemplate, id: '' };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id must be a non-empty string');
    });

    it('requires name to be a non-empty string', () => {
      const template = { ...validTemplate, name: '' };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name must be a non-empty string');
    });

    it('requires description to be a string', () => {
      const template = { ...validTemplate, description: 123 as unknown as string };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('description must be a string');
    });

    it('requires version to be a non-empty string', () => {
      const template = { ...validTemplate, version: '' };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('version must be a non-empty string');
    });
  });

  describe('canvas validation', () => {
    it('requires canvas to be an object', () => {
      const template = { ...validTemplate, canvas: null as unknown };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('canvas must be an object with width and height');
    });

    it('requires canvas.width to be a positive number', () => {
      const template = { ...validTemplate, canvas: { width: 0, height: 1350 } };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('canvas.width'))).toBe(true);
    });

    it('requires canvas.height to be within bounds', () => {
      const template = { ...validTemplate, canvas: { width: 1080, height: 20000 } };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('canvas.height'))).toBe(true);
    });
  });

  describe('background validation', () => {
    it('validates solid background with hex color', () => {
      const template = {
        ...validTemplate,
        background: { type: 'solid' as const, color: '#ff5733' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects solid background with invalid color', () => {
      const template = {
        ...validTemplate,
        background: { type: 'solid' as const, color: 'not-a-color' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('valid hex color'))).toBe(true);
    });

    it('validates gradient background', () => {
      const template = {
        ...validTemplate,
        background: {
          type: 'gradient' as const,
          direction: 'to-bottom' as const,
          stops: [
            { color: '#000000', position: 0 },
            { color: '#ffffff', position: 100 },
          ],
        },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects gradient with invalid direction', () => {
      const template = {
        ...validTemplate,
        background: {
          type: 'gradient' as const,
          direction: 'invalid' as unknown,
          stops: [
            { color: '#000000', position: 0 },
            { color: '#ffffff', position: 100 },
          ],
        },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('direction'))).toBe(true);
    });

    it('rejects gradient with less than 2 stops', () => {
      const template = {
        ...validTemplate,
        background: {
          type: 'gradient' as const,
          direction: 'to-bottom' as const,
          stops: [{ color: '#000000', position: 0 }],
        },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('2-4 color stops'))).toBe(true);
    });

    it('validates image background with relative path', () => {
      const template = {
        ...validTemplate,
        background: { type: 'image' as const, path: 'assets/backgrounds/dark.jpg' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects image background with empty path', () => {
      const template = {
        ...validTemplate,
        background: { type: 'image' as const, path: '' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('path must be a non-empty string'))).toBe(true);
    });

    it('rejects image background with absolute path (security)', () => {
      const template = {
        ...validTemplate,
        background: { type: 'image' as const, path: '/etc/passwd' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('relative path'))).toBe(true);
    });

    it('rejects image background with path traversal (security)', () => {
      const template = {
        ...validTemplate,
        background: { type: 'image' as const, path: '../../../etc/passwd' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('path traversal'))).toBe(true);
    });

    it('rejects image background with Windows absolute path (security)', () => {
      const template = {
        ...validTemplate,
        background: { type: 'image' as const, path: '\\Windows\\System32\\config' },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('relative path'))).toBe(true);
    });

    it('rejects unknown background type', () => {
      const template = {
        ...validTemplate,
        background: { type: 'unknown' as unknown },
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('background.type'))).toBe(true);
    });
  });

  describe('photos validation', () => {
    it('requires photos to be an array', () => {
      const template = { ...validTemplate, photos: 'not-array' as unknown };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('photos must be an array');
    });

    it('validates photo field with all options', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: 400, height: 400 },
            mask: { type: 'circle' as const },
            border: { width: 4, color: '#ffd700' },
            shadow: { blur: 20, offsetX: 0, offsetY: 10, color: '#000000' },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('validates photo with x,y position', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: { x: 100, y: 200 },
            size: { width: 400, height: 400 },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects photo with invalid position', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'invalid-position' as unknown,
            size: { width: 400, height: 400 },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('photos[0].position'))).toBe(true);
    });

    it('rejects photo with invalid size', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: -100, height: 400 },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('photos[0].size.width'))).toBe(true);
    });

    it('validates rounded-rect mask', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: 400, height: 400 },
            mask: { type: 'rounded-rect' as const, radius: 20 },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('validates shadow with hex color', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: 400, height: 400 },
            shadow: { blur: 10, offsetX: 5, offsetY: 5, color: '#000000' },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('validates shadow with rgba color', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: 400, height: 400 },
            shadow: { blur: 10, offsetX: 5, offsetY: 5, color: 'rgba(0,0,0,0.5)' },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects shadow with invalid color format', () => {
      const template = {
        ...validTemplate,
        photos: [
          {
            id: 'photo1',
            position: 'center' as const,
            size: { width: 400, height: 400 },
            shadow: { blur: 10, offsetX: 5, offsetY: 5, color: 'not-a-color' },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('shadow.color'))).toBe(true);
    });
  });

  describe('text validation', () => {
    it('requires text to be an array', () => {
      const template = { ...validTemplate, text: 'not-array' as unknown };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('text must be an array');
    });

    it('validates text field with all style options', () => {
      const template = {
        ...validTemplate,
        text: [
          {
            id: 'title',
            position: { x: 540, y: 100 },
            style: {
              fontFamily: 'Arial',
              fontSize: 48,
              color: '#ffffff',
              align: 'center' as const,
              letterSpacing: 2,
              textTransform: 'uppercase' as const,
            },
            placeholder: 'Title',
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });

    it('rejects text with invalid font size', () => {
      const template = {
        ...validTemplate,
        text: [
          {
            id: 'title',
            position: 'center' as const,
            style: {
              fontFamily: 'Arial',
              fontSize: 0,
              color: '#ffffff',
            },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('fontSize'))).toBe(true);
    });

    it('rejects text with invalid color', () => {
      const template = {
        ...validTemplate,
        text: [
          {
            id: 'title',
            position: 'center' as const,
            style: {
              fontFamily: 'Arial',
              fontSize: 48,
              color: 'not-a-color',
            },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('color'))).toBe(true);
    });

    it('rejects text with invalid align', () => {
      const template = {
        ...validTemplate,
        text: [
          {
            id: 'title',
            position: 'center' as const,
            style: {
              fontFamily: 'Arial',
              fontSize: 48,
              color: '#ffffff',
              align: 'invalid' as unknown,
            },
          },
        ],
      };
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('align'))).toBe(true);
    });
  });
});

describe('isValidTemplate', () => {
  it('returns true for valid template', () => {
    expect(isValidTemplate(validTemplate)).toBe(true);
  });

  it('returns false for invalid template', () => {
    expect(isValidTemplate({})).toBe(false);
  });

  it('acts as type guard', () => {
    const unknown: unknown = validTemplate;
    if (isValidTemplate(unknown)) {
      // TypeScript should know this is PosterTemplate
      expect(unknown.id).toBe('test-template');
    }
  });
});

describe('registerTemplate', () => {
  beforeEach(() => {
    clearTemplates();
  });

  it('registers a valid template', () => {
    registerTemplate(validTemplate);
    expect(isTemplateRegistered('test-template')).toBe(true);
  });

  it('throws TemplateValidationError for invalid template', () => {
    const invalidTemplate = { ...validTemplate, id: '' };
    expect(() => registerTemplate(invalidTemplate)).toThrow(TemplateValidationError);
  });

  it('includes validation errors in exception', () => {
    const invalidTemplate = { ...validTemplate, id: '', name: '' };
    try {
      registerTemplate(invalidTemplate);
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateValidationError);
      expect((error as TemplateValidationError).errors.length).toBeGreaterThan(0);
    }
  });
});

describe('loadTemplate', () => {
  beforeEach(() => {
    clearTemplates();
    registerTemplate(validTemplate);
  });

  it('loads a registered template', () => {
    const template = loadTemplate('test-template');
    expect(template.id).toBe('test-template');
    expect(template.name).toBe('Test Template');
  });

  it('throws TemplateNotFoundError for unknown template', () => {
    expect(() => loadTemplate('non-existent')).toThrow(TemplateNotFoundError);
  });

  it('includes template ID in error message', () => {
    try {
      loadTemplate('my-missing-template');
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateNotFoundError);
      expect((error as Error).message).toContain('my-missing-template');
    }
  });
});

describe('isTemplateRegistered', () => {
  beforeEach(() => {
    clearTemplates();
  });

  it('returns true for registered template', () => {
    registerTemplate(validTemplate);
    expect(isTemplateRegistered('test-template')).toBe(true);
  });

  it('returns false for unregistered template', () => {
    expect(isTemplateRegistered('unknown')).toBe(false);
  });
});

describe('listTemplates', () => {
  beforeEach(() => {
    clearTemplates();
  });

  it('returns empty array when no templates registered', () => {
    expect(listTemplates()).toEqual([]);
  });

  it('returns list of template summaries', () => {
    registerTemplate(validTemplate);
    const template2 = { ...validTemplate, id: 'template-2', name: 'Second Template' };
    registerTemplate(template2);

    const list = listTemplates();
    expect(list).toHaveLength(2);
    expect(list).toContainEqual({
      id: 'test-template',
      name: 'Test Template',
      description: 'A template for testing',
    });
    expect(list).toContainEqual({
      id: 'template-2',
      name: 'Second Template',
      description: 'A template for testing',
    });
  });
});

describe('getAllTemplates', () => {
  beforeEach(() => {
    clearTemplates();
  });

  it('returns all registered templates', () => {
    registerTemplate(validTemplate);
    const templates = getAllTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toEqual(validTemplate);
  });
});

describe('clearTemplates', () => {
  it('removes all registered templates', () => {
    registerTemplate(validTemplate);
    expect(listTemplates()).toHaveLength(1);

    clearTemplates();
    expect(listTemplates()).toHaveLength(0);
  });
});
