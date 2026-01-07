import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedStoreSync } from '../use-debounced-store-sync';

describe('useDebouncedStoreSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('syncs value after debounce delay', () => {
    const onSync = vi.fn();

    renderHook(() =>
      useDebouncedStoreSync('new value', 'old value', onSync, { delayMs: 300 })
    );

    expect(onSync).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSync).toHaveBeenCalledWith('new value');
  });

  it('does not sync when values are equal', () => {
    const onSync = vi.fn();

    renderHook(() =>
      useDebouncedStoreSync('same value', 'same value', onSync, { delayMs: 300 })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSync).not.toHaveBeenCalled();
  });

  it('does not sync invalid values', () => {
    const onSync = vi.fn();
    const validate = vi.fn().mockReturnValue('Invalid');

    renderHook(() =>
      useDebouncedStoreSync('invalid', 'old', onSync, { delayMs: 300, validate })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(validate).toHaveBeenCalledWith('invalid');
    expect(onSync).not.toHaveBeenCalled();
  });

  it('syncs valid values when validation passes', () => {
    const onSync = vi.fn();
    const validate = vi.fn().mockReturnValue(undefined);

    renderHook(() =>
      useDebouncedStoreSync('valid', 'old', onSync, { delayMs: 300, validate })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(validate).toHaveBeenCalledWith('valid');
    expect(onSync).toHaveBeenCalledWith('valid');
  });

  it('cancels pending sync on rapid value changes', () => {
    const onSync = vi.fn();

    const { rerender } = renderHook(
      ({ value }) => useDebouncedStoreSync(value, 'old', onSync, { delayMs: 300 }),
      { initialProps: { value: 'first' } }
    );

    // Change value before debounce completes
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'second' });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'third' });

    // Wait for final debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only the final value should be synced
    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledWith('third');
  });

  it('cleans up timer on unmount', () => {
    const onSync = vi.fn();

    const { unmount } = renderHook(() =>
      useDebouncedStoreSync('new', 'old', onSync, { delayMs: 300 })
    );

    // Unmount before debounce completes
    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onSync).not.toHaveBeenCalled();
  });

  it('uses default delay when not specified', () => {
    const onSync = vi.fn();

    renderHook(() => useDebouncedStoreSync('new', 'old', onSync));

    // Default is 300ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSync).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSync).toHaveBeenCalled();
  });

  it('handles store value updates without causing feedback loop', () => {
    const onSync = vi.fn();

    const { rerender } = renderHook(
      ({ storeValue }) =>
        useDebouncedStoreSync('local', storeValue, onSync, { delayMs: 300 }),
      { initialProps: { storeValue: 'old' } }
    );

    // Store updates mid-debounce (simulating external update)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ storeValue: 'updated externally' });

    // Complete debounce - should still sync since local !== store
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSync).toHaveBeenCalledWith('local');
  });

  it('updates validation function without re-running debounce', () => {
    const onSync = vi.fn();
    const validate1 = vi.fn().mockReturnValue('error');
    const validate2 = vi.fn().mockReturnValue(undefined);

    const { rerender } = renderHook(
      ({ validate }) =>
        useDebouncedStoreSync('value', 'old', onSync, { delayMs: 300, validate }),
      { initialProps: { validate: validate1 } }
    );

    // Update validate function mid-debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ validate: validate2 });

    // Complete debounce - should use updated validate
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(validate2).toHaveBeenCalledWith('value');
    expect(onSync).toHaveBeenCalledWith('value');
  });
});
