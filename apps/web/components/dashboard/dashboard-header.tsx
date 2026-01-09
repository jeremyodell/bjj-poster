'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Trophy, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuotaBadge } from '../builder/quota-badge';
import { UserMenu } from '../builder/user-menu';
import { MobileNav } from '../builder/mobile-nav';
import { Button } from '@/components/ui/button';

/** Scroll threshold in pixels before header style changes */
const SCROLL_THRESHOLD = 10;

export function DashboardHeader(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const ticking = useRef(false);

  const updateScrollState = useCallback(() => {
    setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    ticking.current = false;
  }, []);

  useEffect(() => {
    const handleScroll = (): void => {
      // Throttle scroll events using requestAnimationFrame
      if (!ticking.current) {
        requestAnimationFrame(updateScrollState);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateScrollState]);

  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-50 h-16 border-b transition-all duration-300',
        isScrolled
          ? 'border-surface-800 bg-surface-950/90 shadow-xl shadow-black/20 backdrop-blur-xl backdrop-saturate-150'
          : 'border-transparent bg-surface-950'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="BJJ Poster - Go to homepage">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
            <Trophy className="h-4 w-4 text-surface-950" aria-hidden="true" />
          </div>
          <span className="font-display text-xl tracking-wider text-white">
            BJJ POSTER
          </span>
        </Link>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/builder">
              <Plus className="mr-1.5 h-4 w-4" />
              Create
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-surface-800 sm:block" />
          <QuotaBadge className="hidden md:flex" />
          <div className="hidden h-6 w-px bg-surface-800 md:block" />
          <UserMenu className="hidden md:flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
