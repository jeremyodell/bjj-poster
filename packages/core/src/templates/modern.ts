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
 * Modern template - contemporary design with gradient background and rounded photo
 */
export const modernTemplate: Readonly<PosterTemplate> = deepFreeze({
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with gradient background and rounded photo',
  version: '1.0.0',
  canvas: {
    width: 1080,
    height: 1350,
  },
  background: {
    type: 'gradient',
    direction: 'to-bottom-right',
    stops: [
      { color: '#1e3a5f', position: 0 },
      { color: '#0d1b2a', position: 100 },
    ],
  },
  photos: [
    {
      id: 'athletePhoto',
      position: { anchor: 'top-center', offsetX: 0, offsetY: 150 },
      size: { width: 450, height: 450 },
      mask: { type: 'rounded-rect', radius: 24 },
      shadow: { blur: 30, offsetX: 0, offsetY: 15, color: 'rgba(0,0,0,0.5)' },
    },
  ],
  text: [
    {
      id: 'athleteName',
      position: { anchor: 'center', offsetX: 0, offsetY: 100 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 56,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'achievement',
      position: { anchor: 'center', offsetX: 0, offsetY: 170 },
      style: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 40,
        color: '#4ecdc4',
        align: 'center',
        textTransform: 'uppercase',
      },
      placeholder: 'CHAMPION',
    },
    {
      id: 'tournamentName',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -100 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 28,
        color: '#a0a0a0',
        align: 'center',
      },
      placeholder: 'Tournament Name',
    },
    {
      id: 'date',
      position: { anchor: 'bottom-center', offsetX: 0, offsetY: -60 },
      style: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 20,
        color: '#707070',
        align: 'center',
      },
      placeholder: 'January 2026',
    },
  ],
});
