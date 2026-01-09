'use client';

import Link from 'next/link';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

const YELLOW_THRESHOLD = 50;
const RED_THRESHOLD = 80;

function getProgressColor(percentage: number, isAtLimit: boolean): string {
  if (isAtLimit) return 'bg-red-500';
  if (percentage >= RED_THRESHOLD) return 'bg-red-500';
  if (percentage >= YELLOW_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit, subscriptionTier } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
      subscriptionTier: state.subscriptionTier,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const progressColor = getProgressColor(percentage, isAtLimit);
  const remaining = postersLimit - postersThisMonth;
  const showUpgradeCTA = subscriptionTier === 'free' && percentage >= RED_THRESHOLD;

  const getSubtext = (): string => {
    if (isAtLimit) return 'limit reached';
    if (subscriptionTier === 'pro') return `posters used · ${remaining} remaining`;
    return 'posters used';
  };

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
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
                <span className="ml-2 text-surface-400">{getSubtext()}</span>
              </div>

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
  );
}
