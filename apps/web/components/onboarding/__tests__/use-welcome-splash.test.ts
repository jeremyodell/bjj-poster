import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWelcomeSplash } from '../use-welcome-splash';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useWelcomeSplash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows splash when localStorage flag is not set', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showSplash).toBe(true);
  });

  it('hides splash when localStorage flag is "true"', () => {
    localStorage.setItem('hasSeenWelcome', 'true');

    const { result } = renderHook(() => useWelcomeSplash());

    expect(result.current.showSplash).toBe(false);
  });

  it('dismiss with "builder" sets flag and navigates to /builder', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    act(() => {
      result.current.dismiss('builder');
    });

    expect(localStorage.getItem('hasSeenWelcome')).toBe('true');
    expect(result.current.showSplash).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/builder');
  });

  it('dismiss with "dashboard" sets flag without navigation', () => {
    const { result } = renderHook(() => useWelcomeSplash());

    act(() => {
      result.current.dismiss('dashboard');
    });

    expect(localStorage.getItem('hasSeenWelcome')).toBe('true');
    expect(result.current.showSplash).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
