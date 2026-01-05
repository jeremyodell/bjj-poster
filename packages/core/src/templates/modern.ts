import type { PosterTemplate } from '../image/types.js';

/**
 * Modern Template
 *
 * A contemporary poster design with a larger athlete photo featuring rounded
 * corners, radial gradient background, and bold typography with stroke effects.
 *
 * Layout:
 * - Large rounded-rect athlete photo slightly above center
 * - Tournament name at top with stroke effect
 * - Athlete name with bold stroke below photo
 * - Belt rank and team info
 * - Date and location at bottom
 */
export const modernTemplate: PosterTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with bold typography and rounded photo corners',
  version: '1.0.0',

  canvas: {
    width: 1080,
    height: 1350,
  },

  background: {
    type: 'gradient',
    direction: 'radial',
    stops: [
      { color: '#2d2d44', position: 0 },
      { color: '#1a1a2e', position: 50 },
      { color: '#0f0f1a', position: 100 },
    ],
  },

  photos: [
    {
      id: 'athletePhoto',
      position: { x: 90, y: 280 },
      size: { width: 900, height: 700 },
      mask: { type: 'rounded-rect', radius: 30 },
      shadow: { blur: 30, offsetX: 0, offsetY: 15, color: 'rgba(0,0,0,0.6)' },
    },
  ],

  text: [
    {
      id: 'tournament',
      position: { x: 540, y: 120 },
      style: {
        fontFamily: 'Oswald-Bold',
        fontSize: 56,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 3,
        stroke: { width: 2, color: '#e63946' },
      },
      placeholder: 'TOURNAMENT NAME',
    },
    {
      id: 'eventYear',
      position: { x: 540, y: 180 },
      style: {
        fontFamily: 'BebasNeue-Regular',
        fontSize: 36,
        color: '#e63946',
        align: 'center',
        letterSpacing: 8,
      },
      placeholder: '2025',
    },
    {
      id: 'athleteName',
      position: { x: 540, y: 1070 },
      style: {
        fontFamily: 'Oswald-Bold',
        fontSize: 72,
        color: '#ffffff',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
        stroke: { width: 3, color: '#e63946' },
      },
      placeholder: 'ATHLETE NAME',
    },
    {
      id: 'beltRank',
      position: { x: 540, y: 1140 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 28,
        color: '#e63946',
        align: 'center',
        textTransform: 'uppercase',
        letterSpacing: 4,
      },
      placeholder: 'BLACK BELT',
    },
    {
      id: 'team',
      position: { x: 540, y: 1180 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 24,
        color: '#aaaaaa',
        align: 'center',
      },
      placeholder: 'Team Name',
    },
    {
      id: 'date',
      position: { x: 540, y: 1270 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 26,
        color: '#888888',
        align: 'center',
      },
      placeholder: 'January 1, 2025',
    },
    {
      id: 'location',
      position: { x: 540, y: 1305 },
      style: {
        fontFamily: 'Roboto-Regular',
        fontSize: 22,
        color: '#666666',
        align: 'center',
      },
      placeholder: 'City, State',
    },
  ],
};
