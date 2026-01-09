import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosterGridErrorProps {
  onRetry: () => void;
}

export function PosterGridError({ onRetry }: PosterGridErrorProps): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-surface-800 bg-surface-900/50 p-8">
      <AlertTriangle
        data-testid="error-icon"
        className="mb-4 h-16 w-16 text-amber-500"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        Couldn&apos;t load posters
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Something went wrong. Please try again.
      </p>

      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
