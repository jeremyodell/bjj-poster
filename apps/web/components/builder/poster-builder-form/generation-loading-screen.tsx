'use client';

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

interface GenerationLoadingScreenProps {
  progress: number;
}

export function GenerationLoadingScreen({ progress }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        <div className="mb-6 text-right">
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div className="min-h-[3rem] px-4">
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
