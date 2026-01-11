import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderTour } from '../use-builder-tour';

describe('useBuilderTour', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows tour when localStorage flag is not set', () => {
    const { result } = renderHook(() => useBuilderTour());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showTour).toBe(true);
  });

  it('hides tour when localStorage flag is "true"', () => {
    localStorage.setItem('hasSeenBuilderTour', 'true');

    const { result } = renderHook(() => useBuilderTour());

    expect(result.current.showTour).toBe(false);
  });

  it('completeTour sets flag and hides tour', () => {
    const { result } = renderHook(() => useBuilderTour());

    act(() => {
      result.current.completeTour();
    });

    expect(localStorage.getItem('hasSeenBuilderTour')).toBe('true');
    expect(result.current.showTour).toBe(false);
  });

  it('skipTour sets flag and hides tour', () => {
    const { result } = renderHook(() => useBuilderTour());

    act(() => {
      result.current.skipTour();
    });

    expect(localStorage.getItem('hasSeenBuilderTour')).toBe('true');
    expect(result.current.showTour).toBe(false);
  });
});
