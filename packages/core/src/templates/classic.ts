import type { PosterTemplate } from '../image/types.js';

/**
 * Classic Tournament Template
 *
 * A traditional tournament poster with centered athlete photo in a circle mask,
 * dark gradient background, and gold accents. Text fields are centered vertically.
 *
 * Layout:
 * - Tournament name at top
 * - Circular athlete photo in center with gold border and shadow
 * - Athlete name below photo
 * - Belt rank in gold
 * - Date and location at bottom
 */
export const classicTemplate: PosterTemplate = {
  id: 'classic',
  name: 'Classic Tournament',
  description: 'Traditional tournament poster with centered athlete photo and gold accents',
  version: '1.0.0',

  canvas: {
    width: 1080,
    height: 1350,
  },

  background: {
    type: 'gradient',
    direction: 'to-bottom',
    stops: [
      { color: '#1a1a2e', position: 0 },
      { color: '#16213e', position: 100 },
    ],
  },

  photos: [
    {
      id: 'athletePhoto',
      position: 'center',
      size: { width: 600, height: 600 },
      mask: { type: 'circle' },
      border: { width: 4, color: '#ffd700' },
      shadow: { blur: 20, offsetX: 0, offsetY: 10, color: 'rgba(0,0,0,0.5)' },
    },
  ],

  text: [
    {
      id: 'tournament',
      position: { x: 540, y: 150 },
      style: {
        fontFamily: 'BebasNeue-Regular',
        fontSize: 48,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 4,
      },
      placeholder: 'TOURNAMENT NAME',
    },
    {
      id: 'athleteName',
      position: { x: 540, y: 950 },
      style: {
        fontFamily: 'Oswald-Bold',
        fontSize: 64,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'beltRank',
      position: { x: 540, y: 1020 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 32,
        color: '#ffd700',
        align: 'center',
      },
      placeholder: 'Black Belt',
    },
    {
      id: 'date',
      position: { x: 540, y: 1200 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 28,
        color: '#cccccc',
        align: 'center',
      },
      placeholder: 'January 1, 2025',
    },
    {
      id: 'location',
      position: { x: 540, y: 1240 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 24,
        color: '#999999',
        align: 'center',
      },
      placeholder: 'City, State',
    },
  ],
};
