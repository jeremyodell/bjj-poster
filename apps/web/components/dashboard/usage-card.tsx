'use client';

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
  const { postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const progressColor = getProgressColor(percentage, isAtLimit);

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
        <div
          data-testid="usage-progress"
          className={cn('h-full rounded-full transition-all duration-500', progressColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
