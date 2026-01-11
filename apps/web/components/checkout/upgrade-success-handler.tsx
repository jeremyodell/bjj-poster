'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Handles upgrade success/cancel URL parameters
 * Shows appropriate toast and clears the URL params
 *
 * Add this component to pages that receive redirect from Stripe:
 * - /dashboard (success)
 * - /pricing (cancel)
 */
export function UpgradeSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasHandled = useRef(false);

  useEffect(() => {
    // Prevent double handling in StrictMode
    if (hasHandled.current) return;

    const upgradeStatus = searchParams.get('upgrade');

    if (upgradeStatus === 'success') {
      hasHandled.current = true;
      toast.success('Welcome to your new plan!', {
        description: 'Your upgrade is now active.',
        duration: 5000,
      });

      // Clear URL params
      router.replace(pathname);
    } else if (upgradeStatus === 'cancelled') {
      hasHandled.current = true;
      toast.info('Upgrade cancelled', {
        description: 'You can try again anytime.',
        duration: 4000,
      });

      // Clear URL params
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  // This component renders nothing
  return null;
}
