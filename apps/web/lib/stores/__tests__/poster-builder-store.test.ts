import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePosterBuilderStore } from '../poster-builder-store';

describe('usePosterBuilderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      usePosterBuilderStore.getState().reset();
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = usePosterBuilderStore.getState();

      expect(state.athletePhoto).toBeNull();
      expect(state.athleteName).toBe('');
      expect(state.beltRank).toBe('white');
      expect(state.team).toBe('');
      expect(state.tournament).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
      expect(state.selectedTemplateId).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
      expect(state.showAdvancedOptions).toBe(false);
      expect(state.showPreview).toBe(false);
    });
  });

  describe('setField', () => {
    it('updates athleteName correctly', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
      });

      expect(usePosterBuilderStore.getState().athleteName).toBe('John Doe');
    });

    it('updates beltRank correctly', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('beltRank', 'purple');
      });

      expect(usePosterBuilderStore.getState().beltRank).toBe('purple');
    });

    it('updates multiple fields independently', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('team', 'Gracie Barra');
        usePosterBuilderStore.getState().setField('tournament', 'IBJJF Worlds');
      });

      const state = usePosterBuilderStore.getState();
      expect(state.team).toBe('Gracie Barra');
      expect(state.tournament).toBe('IBJJF Worlds');
    });
  });

  describe('setPhoto', () => {
    it('sets athletePhoto to File object', () => {
      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        usePosterBuilderStore.getState().setPhoto(mockFile);
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBe(mockFile);
    });

    it('sets athletePhoto to null', () => {
      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        usePosterBuilderStore.getState().setPhoto(mockFile);
        usePosterBuilderStore.getState().setPhoto(null);
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBeNull();
    });
  });

  describe('setTemplate', () => {
    it('sets selectedTemplateId', () => {
      act(() => {
        usePosterBuilderStore.getState().setTemplate('template-123');
      });

      expect(usePosterBuilderStore.getState().selectedTemplateId).toBe(
        'template-123'
      );
    });

    it('clears selectedTemplateId with null', () => {
      act(() => {
        usePosterBuilderStore.getState().setTemplate('template-123');
        usePosterBuilderStore.getState().setTemplate(null);
      });

      expect(usePosterBuilderStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe('setGenerating', () => {
    it('sets isGenerating to true', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true);
      });

      expect(usePosterBuilderStore.getState().isGenerating).toBe(true);
    });

    it('sets isGenerating and progress together', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true, 50);
      });

      const state = usePosterBuilderStore.getState();
      expect(state.isGenerating).toBe(true);
      expect(state.generationProgress).toBe(50);
    });

    it('resets progress when setting isGenerating to false', () => {
      act(() => {
        usePosterBuilderStore.getState().setGenerating(true, 75);
        usePosterBuilderStore.getState().setGenerating(false);
      });

      const state = usePosterBuilderStore.getState();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
    });
  });

  describe('toggleAdvancedOptions', () => {
    it('toggles from false to true', () => {
      act(() => {
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      expect(usePosterBuilderStore.getState().showAdvancedOptions).toBe(true);
    });

    it('toggles from true to false', () => {
      act(() => {
        usePosterBuilderStore.getState().toggleAdvancedOptions();
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      expect(usePosterBuilderStore.getState().showAdvancedOptions).toBe(false);
    });
  });

  describe('togglePreview', () => {
    it('toggles from false to true', () => {
      act(() => {
        usePosterBuilderStore.getState().togglePreview();
      });

      expect(usePosterBuilderStore.getState().showPreview).toBe(true);
    });

    it('toggles from true to false', () => {
      act(() => {
        usePosterBuilderStore.getState().togglePreview();
        usePosterBuilderStore.getState().togglePreview();
      });

      expect(usePosterBuilderStore.getState().showPreview).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all fields to initial values', () => {
      // Set up state with various values
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
        usePosterBuilderStore.getState().setField('beltRank', 'black');
        usePosterBuilderStore.getState().setField('team', 'Team Alpha');
        usePosterBuilderStore.getState().setTemplate('template-456');
        usePosterBuilderStore.getState().setGenerating(true, 50);
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      // Reset
      act(() => {
        usePosterBuilderStore.getState().reset();
      });

      // Verify all values are back to defaults
      const state = usePosterBuilderStore.getState();
      expect(state.athletePhoto).toBeNull();
      expect(state.athleteName).toBe('');
      expect(state.beltRank).toBe('white');
      expect(state.team).toBe('');
      expect(state.tournament).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
      expect(state.selectedTemplateId).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
      expect(state.showAdvancedOptions).toBe(false);
      expect(state.showPreview).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('persists form fields to localStorage', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'John Doe');
        usePosterBuilderStore.getState().setField('team', 'Gracie Barra');
        usePosterBuilderStore.getState().setField('beltRank', 'purple');
      });

      // Manually trigger persist (in real app this happens automatically)
      usePosterBuilderStore.persist.rehydrate();

      const stored = localStorage.getItem('poster-builder-draft');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.athleteName).toBe('John Doe');
      expect(parsed.state.team).toBe('Gracie Barra');
      expect(parsed.state.beltRank).toBe('purple');
    });

    it('excludes athletePhoto from persistence', () => {
      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      act(() => {
        usePosterBuilderStore.getState().setPhoto(mockFile);
        usePosterBuilderStore.getState().setField('athleteName', 'Test');
      });

      usePosterBuilderStore.persist.rehydrate();

      const stored = localStorage.getItem('poster-builder-draft');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.athletePhoto).toBeUndefined();
      expect(parsed.state.athleteName).toBe('Test');
    });

    it('excludes UI state from persistence', () => {
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'Test');
        usePosterBuilderStore.getState().setGenerating(true, 50);
        usePosterBuilderStore.getState().toggleAdvancedOptions();
        usePosterBuilderStore.getState().togglePreview();
      });

      usePosterBuilderStore.persist.rehydrate();

      const stored = localStorage.getItem('poster-builder-draft');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.isGenerating).toBeUndefined();
      expect(parsed.state.generationProgress).toBeUndefined();
      expect(parsed.state.showAdvancedOptions).toBeUndefined();
      expect(parsed.state.showPreview).toBeUndefined();
    });

    it('only persists partialized fields (form data, not UI state)', () => {
      // Set all fields including UI state
      act(() => {
        usePosterBuilderStore.getState().setField('athleteName', 'Form User');
        usePosterBuilderStore.getState().setField('beltRank', 'brown');
        usePosterBuilderStore.getState().setField('team', 'Alliance');
        usePosterBuilderStore.getState().setField('tournament', 'Pan Ams');
        usePosterBuilderStore.getState().setField('date', '2026-03-15');
        usePosterBuilderStore.getState().setField('location', 'Irvine, CA');
        usePosterBuilderStore.getState().setTemplate('template-123');
        usePosterBuilderStore.getState().setGenerating(true, 75);
        usePosterBuilderStore.getState().toggleAdvancedOptions();
      });

      // Trigger persistence
      usePosterBuilderStore.persist.rehydrate();

      // Verify localStorage contains only partialized fields
      const stored = localStorage.getItem('poster-builder-draft');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      const persistedKeys = Object.keys(parsed.state);

      // Should include form fields
      expect(persistedKeys).toContain('athleteName');
      expect(persistedKeys).toContain('beltRank');
      expect(persistedKeys).toContain('team');
      expect(persistedKeys).toContain('tournament');
      expect(persistedKeys).toContain('date');
      expect(persistedKeys).toContain('location');
      expect(persistedKeys).toContain('selectedTemplateId');

      // Should NOT include UI state or File
      expect(persistedKeys).not.toContain('athletePhoto');
      expect(persistedKeys).not.toContain('isGenerating');
      expect(persistedKeys).not.toContain('generationProgress');
      expect(persistedKeys).not.toContain('showAdvancedOptions');
      expect(persistedKeys).not.toContain('showPreview');

      // Verify values are correct
      expect(parsed.state.athleteName).toBe('Form User');
      expect(parsed.state.beltRank).toBe('brown');
      expect(parsed.state.selectedTemplateId).toBe('template-123');
    });
  });
});
