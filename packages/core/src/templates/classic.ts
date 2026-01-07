import type { PosterTemplate } from './types.js';

/**
 * Deep freeze an object to prevent mutations
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  });
  return Object.freeze(obj);
}

/**
 * Classic template - traditional tournament poster with centered photo and bold text
 */
export const classicTemplate: Readonly<PosterTemplate> = deepFreeze({
  id: 'classic',
  name: 'Classic',
  description: 'Traditional tournament poster with centered photo and bold text',
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
      position: { anchor: 'center', offsetX: 0, offsetY: -100 },
      size: { width: 500, height: 500 },
      mask: { type: 'circle' },
      border: { width: 4, color: '#ffd700' },
    },
  ],
  text: [
    {
      id: 'athleteName',
      position: { anchor: 'center', offsetX: 0, offsetY: 220 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 64,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'achievement',
      position: { anchor: 'center', offsetX: 0, offsetY: 300 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 48,
        color: '#ffd700',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'GOLD MEDAL',
    },
    {
      id: 'tournamentName',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -120 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 32,
        color: '#cccccc',
        align: 'center',
      },
      placeholder: 'Tournament Name',
    },
    {
      id: 'date',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -70 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 24,
        color: '#888888',
        align: 'center',
      },
      placeholder: 'January 2026',
    },
  ],
});
