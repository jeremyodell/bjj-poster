'use client';

import { useEffect, useRef } from 'react';

/** Default debounce delay in milliseconds */
const DEFAULT_DEBOUNCE_MS = 300;

interface UseDebouncedStoreSyncOptions {
  /** Debounce delay in milliseconds */
  delayMs?: number;
  /** Validation function - returns error message if invalid */
  validate?: (value: string) => string | undefined;
}

/**
 * Hook for debounced syncing of local state to a store.
 * Only syncs valid values after the debounce period.
 * Properly cleans up timers on unmount.
 *
 * @param localValue - The current local value
 * @param storeValue - The current store value (used for initial comparison only)
 * @param onSync - Callback to sync the value to the store
 * @param options - Configuration options
 */
export function useDebouncedStoreSync(
  localValue: string,
  storeValue: string,
  onSync: (value: string) => void,
  options: UseDebouncedStoreSyncOptions = {}
): void {
  const { delayMs = DEFAULT_DEBOUNCE_MS, validate } = options;

  // Use refs to avoid stale closures and prevent feedback loops
  const storeValueRef = useRef(storeValue);
  const onSyncRef = useRef(onSync);
  const validateRef = useRef(validate);

  // Update refs when values change
  useEffect(() => {
    storeValueRef.current = storeValue;
  }, [storeValue]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  // Debounced sync effect - only depends on localValue and delayMs
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only sync if value differs from store
      if (localValue !== storeValueRef.current) {
        // Only sync valid values
        const error = validateRef.current?.(localValue);
        if (!error) {
          onSyncRef.current(localValue);
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [localValue, delayMs]);
}
