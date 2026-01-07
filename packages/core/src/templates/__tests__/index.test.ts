import { describe, it, expect } from 'vitest';
import { loadTemplate, listTemplates, validateTemplate } from '../index.js';
import { TemplateNotFoundError } from '../errors.js';

describe('loadTemplate', () => {
  it('should load classic template by id', () => {
    const template = loadTemplate('classic');
    expect(template.id).toBe('classic');
    expect(template.name).toBe('Classic');
  });

  it('should load modern template by id', () => {
    const template = loadTemplate('modern');
    expect(template.id).toBe('modern');
    expect(template.name).toBe('Modern');
  });

  it('should throw TemplateNotFoundError for unknown id', () => {
    expect(() => loadTemplate('nonexistent')).toThrow(TemplateNotFoundError);
    expect(() => loadTemplate('nonexistent')).toThrow('Template not found: nonexistent');
  });
});

describe('listTemplates', () => {
  it('should return array of template info', () => {
    const templates = listTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThanOrEqual(2);
  });

  it('should include classic template', () => {
    const templates = listTemplates();
    const classic = templates.find((t) => t.id === 'classic');
    expect(classic).toBeDefined();
    expect(classic?.name).toBe('Classic');
    expect(classic?.description).toBeDefined();
  });

  it('should include modern template', () => {
    const templates = listTemplates();
    const modern = templates.find((t) => t.id === 'modern');
    expect(modern).toBeDefined();
    expect(modern?.name).toBe('Modern');
    expect(modern?.description).toBeDefined();
  });

  it('should only return id, name, and description', () => {
    const templates = listTemplates();
    const template = templates[0];
    expect(Object.keys(template).sort()).toEqual(['description', 'id', 'name']);
  });
});

describe('validateTemplate', () => {
  it('should return success for valid template', () => {
    const validTemplate = {
      id: 'test',
      name: 'Test',
      description: 'Test template',
      version: '1.0.0',
      canvas: { width: 1080, height: 1350 },
      background: { type: 'solid', color: '#000000' },
      photos: [
        {
          id: 'photo',
          position: { anchor: 'center', offsetX: 0, offsetY: 0 },
          size: { width: 100, height: 100 },
        },
      ],
      text: [],
    };
    const result = validateTemplate(validTemplate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('test');
    }
  });

  it('should return failure with errors for invalid template', () => {
    const invalidTemplate = {
      id: '',
      name: 'Test',
      version: 'invalid',
    };
    const result = validateTemplate(invalidTemplate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should validate bundled templates successfully', () => {
    const classic = loadTemplate('classic');
    const modern = loadTemplate('modern');

    expect(validateTemplate(classic).success).toBe(true);
    expect(validateTemplate(modern).success).toBe(true);
  });
});
