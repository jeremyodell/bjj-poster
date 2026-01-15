'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QuotaBadgeProps {
  className?: string;
}

export function QuotaBadge({ className }: QuotaBadgeProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);
  const postersLimit = useUserStore((state) => state.postersLimit);

  const percentage = postersLimit > 0 ? (postersThisMonth / postersLimit) * 100 : 0;
  const remaining = postersLimit - postersThisMonth;
  const showUpgradeUI = percentage >= 50;
  const showCrownIcon = percentage >= 80;

  const dotColor =
    percentage < 50
      ? 'bg-emerald-500 shadow-emerald-500/50'
      : percentage < 80
        ? 'bg-amber-500 shadow-amber-500/50'
        : 'bg-red-500 shadow-red-500/50';

  const handleUpgradeClick = () => {
    track('quota_badge_upgrade_clicked', {
      usage_percentage: Math.round(percentage),
      posters_remaining: remaining,
    });
  };

  const badgeContent = (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-full border bg-surface-900/50 px-3 py-1.5 transition-all duration-300',
        showUpgradeUI
          ? 'border-gold-500/30 hover:border-gold-500/50 cursor-pointer'
          : 'border-surface-800',
        className
      )}
    >
      {showCrownIcon && (
        <Crown
          data-testid="crown-icon"
          className="h-3 w-3 text-gold-500/70 animate-in fade-in duration-300"
        />
      )}
      <div
        data-testid="quota-dot"
        className={cn('h-2 w-2 rounded-full shadow-sm', dotColor)}
      />
      <span className="text-sm text-surface-400">
        <span className="font-semibold text-white">{postersThisMonth}</span>
        <span className="mx-1 text-surface-600">/</span>
        <span className="font-semibold text-white">{postersLimit}</span>
        <span className="ml-1 text-surface-500">used</span>
      </span>
    </div>
  );

  if (!showUpgradeUI) {
    return badgeContent;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="View usage and upgrade options">
          {badgeContent}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 border-surface-700 bg-surface-900 p-4"
        align="end"
      >
        <p className="mb-3 text-sm text-surface-300">
          {showCrownIcon
            ? `${remaining <= 0 ? 'No' : remaining} poster${remaining === 1 ? '' : 's'} left`
            : 'Running low on posters?'}
        </p>
        <p className="mb-4 text-xs text-surface-400">
          Upgrade for more posters and premium features.
        </p>
        <Link
          href="/pricing"
          onClick={handleUpgradeClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-500 hover:text-gold-400 transition-colors"
        >
          View Plans
          <span aria-hidden="true">-&gt;</span>
        </Link>
      </PopoverContent>
    </Popover>
  );
}
