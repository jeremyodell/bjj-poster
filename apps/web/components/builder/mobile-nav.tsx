'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { QuotaBadge } from './quota-badge';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const resetUser = useUserStore((state) => state.resetUser);

  const handleSettings = (): void => {
    setIsOpen(false);
    router.push('/settings');
  };

  const handleLogout = (): void => {
    setIsOpen(false);
    resetUser();
    router.push('/');
  };

  return (
    <div className={cn('md:hidden', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="h-9 w-9 text-white hover:bg-primary-800"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-72 border-primary-800 bg-primary-900 p-0"
        >
          <SheetHeader className="border-b border-primary-800 p-4">
            <div className="flex items-center justify-between">
              <SheetTitle asChild>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="font-display text-xl text-white"
                >
                  BJJ Poster
                </Link>
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="h-8 w-8 text-white hover:bg-primary-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription className="sr-only">
              Navigation menu with settings and logout options
            </SheetDescription>
          </SheetHeader>

          <div className="border-b border-primary-800 p-4">
            <QuotaBadge />
          </div>

          <nav className="p-2">
            <Button
              variant="ghost"
              onClick={handleSettings}
              aria-label="Settings"
              className="h-12 w-full justify-start text-white hover:bg-primary-800"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              aria-label="Log out"
              className="h-12 w-full justify-start text-red-400 hover:bg-primary-800 hover:text-red-400"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Log out
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
