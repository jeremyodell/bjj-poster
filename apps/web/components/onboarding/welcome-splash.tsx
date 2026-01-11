'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useWelcomeSplash } from './use-welcome-splash';

const BENEFITS = [
  'No design skills needed',
  'Professional quality',
  'Share instantly',
] as const;

export function WelcomeSplash(): JSX.Element | null {
  const { showSplash, isLoading, dismiss } = useWelcomeSplash();

  if (isLoading || !showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/95 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl rounded-2xl border border-surface-700 bg-surface-800 p-8 text-center shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <span className="text-4xl" role="img" aria-label="martial arts">
            🥋
          </span>
          <h1 className="mt-2 font-display text-3xl tracking-wide text-white">
            BJJ Poster Builder
          </h1>
        </div>

        {/* Headline */}
        <p className="mb-8 text-xl text-surface-300">
          Create Tournament Posters in 3 Steps
        </p>

        {/* Example Posters */}
        <div className="mb-8 flex justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid="poster-placeholder"
              className="aspect-[3/4] w-24 rounded-lg bg-gradient-to-br from-surface-700 to-surface-600 shadow-lg sm:w-28"
            />
          ))}
        </div>

        {/* Benefits */}
        <ul className="mb-8 space-y-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center justify-center gap-2 text-surface-300"
            >
              <span className="text-gold-500">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => dismiss('builder')}
        >
          Create My First Poster
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Skip Link */}
        <button
          type="button"
          onClick={() => dismiss('dashboard')}
          className="mt-4 text-sm text-surface-400 transition-colors hover:text-white"
        >
          Skip to Dashboard
        </button>
      </div>
    </div>
  );
}
