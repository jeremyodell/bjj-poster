'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        'sticky top-0 z-50 h-16 transition-all duration-200',
        isScrolled
          ? 'bg-primary-900/80 shadow-lg backdrop-blur-md'
          : 'bg-primary-900'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link
          href="/dashboard"
          className="font-display text-xl text-white hover:text-primary-200"
        >
          BJJ Poster
        </Link>

        <div className="flex items-center gap-4">
          <QuotaBadge className="hidden md:flex" />
          <UserMenu className="hidden md:flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
