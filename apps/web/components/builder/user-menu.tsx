'use client';

import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps): JSX.Element {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const resetUser = useUserStore((state) => state.resetUser);

  const initial = user?.name?.[0]?.toUpperCase();

  const handleSettings = (): void => {
    router.push('/settings');
  };

  const handleLogout = (): void => {
    resetUser();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-900',
            className
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary-700 text-sm font-medium text-white">
              {initial ? (
                initial
              ) : (
                <User className="h-4 w-4" data-testid="user-icon" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border-primary-700 bg-primary-800"
      >
        <DropdownMenuItem
          onClick={handleSettings}
          className="cursor-pointer text-white focus:bg-primary-700 focus:text-white"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-400 focus:bg-primary-700 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
