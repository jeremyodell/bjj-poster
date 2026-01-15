'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, X } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'premium-feature-strip-dismissed';

const LOCKED_FEATURES = ['HD Export', 'No Watermark', 'Background Removal'];

interface PremiumFeatureStripProps {
  className?: string;
}

export function PremiumFeatureStrip({
  className,
}: PremiumFeatureStripProps): JSX.Element | null {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  // Check localStorage on mount (client-side only)
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);
    setIsHydrated(true);
  }, []);

  // Track view once
  useEffect(() => {
    if (
      isHydrated &&
      !isDismissed &&
      subscriptionTier === 'free' &&
      !hasTrackedView
    ) {
      track('feature_teaser_viewed', { source: 'builder' });
      setHasTrackedView(true);
    }
  }, [isHydrated, isDismissed, subscriptionTier, hasTrackedView]);

  // Don't render for paid users
  if (subscriptionTier !== 'free') {
    return null;
  }

  // Don't render until hydrated or if dismissed
  if (!isHydrated || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    track('feature_teaser_dismissed', { source: 'builder' });
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleCtaClick = () => {
    track('feature_teaser_clicked', { source: 'builder' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border border-surface-800 bg-surface-900/50 px-4 py-2.5',
          className
        )}
      >
        <div className="flex items-center gap-4 overflow-x-auto">
          {LOCKED_FEATURES.map((feature, index) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs text-surface-400"
            >
              <Lock className="h-3 w-3 text-surface-500" aria-hidden="true" />
              <span>{feature}</span>
              {index < LOCKED_FEATURES.length - 1 && (
                <span className="ml-2 text-surface-600" aria-hidden="true">
                  ·
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/pricing"
            onClick={handleCtaClick}
            className="whitespace-nowrap text-xs font-medium text-gold-500 transition-colors hover:text-gold-400"
          >
            Unlock with Pro
            <span aria-hidden="true"> →</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss premium features banner"
            className="p-1 text-surface-500 transition-colors hover:text-surface-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
