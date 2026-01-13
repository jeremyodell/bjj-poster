'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuotaBadge } from './quota-badge';
import { UserMenu } from './user-menu';
import { MobileNav } from './mobile-nav';

export function BuilderHeader(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        {/* Left side - Logo and back */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Go back to home"
            className="group flex items-center gap-2 text-surface-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden text-sm sm:inline">Back</span>
          </Link>

          <div className="h-6 w-px bg-surface-800" />

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
              <Trophy className="h-4 w-4 text-surface-950" />
            </div>
            <span className="font-display text-xl tracking-wider text-white">
              BJJ POSTER
            </span>
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <QuotaBadge className="hidden md:flex" />
          <div className="hidden h-6 w-px bg-surface-800 md:block" />
          <UserMenu className="hidden md:flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
