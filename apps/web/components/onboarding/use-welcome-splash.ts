'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'hasSeenWelcome';

interface UseWelcomeSplashReturn {
  showSplash: boolean;
  isLoading: boolean;
  dismiss: (navigateTo: 'builder' | 'dashboard') => void;
}

export function useWelcomeSplash(): UseWelcomeSplashReturn {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    setShowSplash(hasSeenWelcome !== 'true');
    setIsLoading(false);
  }, []);

  const dismiss = (navigateTo: 'builder' | 'dashboard'): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowSplash(false);
    if (navigateTo === 'builder') {
      router.push('/builder');
    }
  };

  return { showSplash, isLoading, dismiss };
}
