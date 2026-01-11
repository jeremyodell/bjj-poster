'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hasSeenBuilderTour';

interface UseBuilderTourReturn {
  showTour: boolean;
  isLoading: boolean;
  completeTour: () => void;
  skipTour: () => void;
}

export function useBuilderTour(): UseBuilderTourReturn {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(STORAGE_KEY);
    setShowTour(hasSeenTour !== 'true');
    setIsLoading(false);
  }, []);

  const completeTour = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  const skipTour = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  return { showTour, isLoading, completeTour, skipTour };
}
