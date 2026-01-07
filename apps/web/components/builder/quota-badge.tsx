'use client';

import { useUserStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface QuotaBadgeProps {
  className?: string;
}

export function QuotaBadge({ className }: QuotaBadgeProps): JSX.Element {
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);
  const postersLimit = useUserStore((state) => state.postersLimit);

  const percentage = postersLimit > 0 ? (postersThisMonth / postersLimit) * 100 : 0;

  const dotColor =
    percentage < 50
      ? 'bg-green-500'
      : percentage < 80
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        data-testid="quota-dot"
        className={cn('h-2 w-2 rounded-full', dotColor)}
      />
      <span className="font-body text-sm text-primary-300">
        <span className="font-medium text-white">{postersThisMonth}</span>
        {' of '}
        <span className="font-medium text-white">{postersLimit}</span>
        {' used'}
      </span>
    </div>
  );
}
