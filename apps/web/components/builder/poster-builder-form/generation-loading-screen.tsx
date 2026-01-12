'use client';

import { useState, useEffect, useRef } from 'react';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

const TIMEOUT_SECONDS = 60;

interface GenerationLoadingScreenProps {
  progress: number;
  onTimeout?: () => void;
}

export function GenerationLoadingScreen({ progress, onTimeout }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutCalledRef = useRef(false);

  // Reset state on mount to ensure fresh state for each generation session.
  // This handles the case where the component might be reused without full unmount.
  useEffect(() => {
    setTipIndex(0);
    setElapsedSeconds(0);
    setHasTimedOut(false);
    timeoutCalledRef.current = false;
  }, []);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track elapsed time and handle timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newValue = prev + 1;

        // Check for timeout
        if (newValue >= TIMEOUT_SECONDS && !timeoutCalledRef.current) {
          timeoutCalledRef.current = true;
          setHasTimedOut(true);
          onTimeout?.();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  const getTimeMessage = (): string => {
    if (hasTimedOut) {
      return "Taking longer than usual. We'll email you when ready!";
    }
    if (elapsedSeconds >= 20) {
      return "Almost done! A few more seconds...";
    }
    return "Usually takes 15-20 seconds";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div
          className="mb-6 text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div
          className="min-h-[3rem] px-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Time Estimate */}
        <p
          className={cn(
            "mt-4 text-sm",
            hasTimedOut ? "text-amber-400" : "text-surface-400"
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {getTimeMessage()}
        </p>
      </div>
    </div>
  );
}
