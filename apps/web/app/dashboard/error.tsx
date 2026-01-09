'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Dashboard error boundary page.
 * Handles runtime errors in the dashboard route.
 */
export default function DashboardError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-6 h-16 w-16 text-amber-500" aria-hidden="true" />
        <h1 className="mb-2 font-display text-3xl tracking-wide text-white">
          SOMETHING WENT WRONG
        </h1>
        <p className="mb-8 max-w-md text-surface-400">
          We encountered an error loading the dashboard. Please try again or return to the home
          page.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
