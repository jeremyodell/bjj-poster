'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Crown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

/**
 * Percentage threshold for showing warning color on progress bar.
 * At 2/3 usage, we alert users they're approaching their limit.
 */
const NEAR_LIMIT_THRESHOLD = 66;

/**
 * Percentage threshold for showing upgrade CTA to free users.
 * At 50% usage, we start encouraging upgrades.
 */
const UPGRADE_CTA_THRESHOLD = 50;

export function WelcomeSection(): JSX.Element {
  const { user, postersThisMonth, postersLimit, subscriptionTier } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
      subscriptionTier: state.subscriptionTier,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= NEAR_LIMIT_THRESHOLD;
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const showUpgradeCTA = subscriptionTier === 'free' && percentage >= UPGRADE_CTA_THRESHOLD;

  // Determine progress bar color
  const progressColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const userName = user?.name?.split(' ')[0] || '';

  return (
    <section className="mb-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">
          WELCOME BACK{userName ? `, ${userName.toUpperCase()}` : ''}
        </h1>
        <p className="mt-2 text-surface-400">
          {isAtLimit
            ? "You've reached your monthly limit. Upgrade to create more posters."
            : 'Ready to create your next championship poster?'}
        </p>
      </div>

      {/* Usage Card */}
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Usage Stats */}
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
              <span className="text-sm font-medium text-surface-300">Monthly Usage</span>
            </div>

            {isUnlimited ? (
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold-500" aria-hidden="true" />
                <span className="font-display text-2xl text-gold-500">UNLIMITED</span>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl text-white">{postersThisMonth}</span>
                  <span className="text-surface-500">/</span>
                  <span className="font-display text-4xl text-white">{postersLimit}</span>
                  <span className="ml-2 text-surface-400">posters used</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
                  <div
                    data-testid="usage-progress"
                    className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Upgrade CTA */}
          {showUpgradeCTA && (
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-medium text-gold-400 transition-all hover:border-gold-500/50 hover:bg-gold-500/20 hover:text-gold-300"
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
