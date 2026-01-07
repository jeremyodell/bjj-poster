import { describe, it, expect } from 'vitest';
import { convertTemplatePosition } from '../position-utils.js';
import type { TemplatePosition } from '../../templates/types.js';

describe('convertTemplatePosition', () => {
  const canvas = { width: 1080, height: 1350 };

  describe('center anchor', () => {
    it('converts center anchor with zero offset', () => {
      const pos: TemplatePosition = { anchor: 'center', offsetX: 0, offsetY: 0 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 675 });
    });

    it('converts center anchor with positive offset', () => {
      const pos: TemplatePosition = { anchor: 'center', offsetX: 100, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 640, y: 625 });
    });
  });

  describe('top anchors', () => {
    it('converts top-center anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-center', offsetX: 0, offsetY: 100 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 100 });
    });

    it('converts top-left anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-left', offsetX: 50, offsetY: 50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 50, y: 50 });
    });

    it('converts top-right anchor', () => {
      const pos: TemplatePosition = { anchor: 'top-right', offsetX: -50, offsetY: 50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 1030, y: 50 });
    });
  });

  describe('bottom anchors', () => {
    it('converts bottom-center anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-center', offsetX: 0, offsetY: -100 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 540, y: 1250 });
    });

    it('converts bottom-left anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-left', offsetX: 50, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 50, y: 1300 });
    });

    it('converts bottom-right anchor', () => {
      const pos: TemplatePosition = { anchor: 'bottom-right', offsetX: -50, offsetY: -50 };
      expect(convertTemplatePosition(pos, canvas)).toEqual({ x: 1030, y: 1300 });
    });
  });
});
