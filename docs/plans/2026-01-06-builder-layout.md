# Builder Layout & Header Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create poster builder layout with sticky header showing logo, quota badge, and user menu with mobile responsiveness.

**Architecture:** Component-based with BuilderLayout wrapping builder routes, BuilderHeader as the main container, and sub-components (QuotaBadge, UserMenu, MobileNav) for modularity. Uses existing useUserStore for state.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/ui (Sheet, DropdownMenu, Avatar), lucide-react icons, Vitest + Testing Library

---

## Task 1: QuotaBadge Component

**Files:**
- Create: `apps/web/components/builder/quota-badge.tsx`
- Create: `apps/web/components/builder/__tests__/quota-badge.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/builder/__tests__/quota-badge.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotaBadge } from '../quota-badge';

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
}));

describe('QuotaBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the correct count', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ postersThisMonth: 2, postersLimit: 5 })
    );

    render(<QuotaBadge />);

    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/used/)).toBeInTheDocument();
  });

  it('shows green dot when under 50% used', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ postersThisMonth: 2, postersLimit: 5 })
    );

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-green-500');
  });

  it('shows yellow dot when 50-80% used', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ postersThisMonth: 3, postersLimit: 5 })
    );

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-yellow-500');
  });

  it('shows red dot when 80% or more used', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ postersThisMonth: 4, postersLimit: 5 })
    );

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-red-500');
  });

  it('shows red dot when at 100%', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ postersThisMonth: 5, postersLimit: 5 })
    );

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-red-500');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/quota-badge.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/quota-badge.tsx
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/quota-badge.test.tsx`
Expected: PASS - all 5 tests passing

**Step 5: Commit**

```bash
git add apps/web/components/builder/quota-badge.tsx apps/web/components/builder/__tests__/quota-badge.test.tsx
git commit -m "feat(web): add QuotaBadge component with color-coded indicator"
```

---

## Task 2: UserMenu Component

**Files:**
- Create: `apps/web/components/builder/user-menu.tsx`
- Create: `apps/web/components/builder/__tests__/user-menu.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/builder/__tests__/user-menu.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMenu } from '../user-menu';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the user store
const mockResetUser = vi.fn();
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows initial when user has name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John Doe', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('shows user icon when no name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('navigates to settings when clicked', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Settings'));

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('calls resetUser and redirects on logout', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Log out'));

    expect(mockResetUser).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/user-menu.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/user-menu.tsx
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/user-menu.test.tsx`
Expected: PASS - all 5 tests passing

**Step 5: Commit**

```bash
git add apps/web/components/builder/user-menu.tsx apps/web/components/builder/__tests__/user-menu.test.tsx
git commit -m "feat(web): add UserMenu component with avatar dropdown"
```

---

## Task 3: MobileNav Component

**Files:**
- Create: `apps/web/components/builder/mobile-nav.tsx`
- Create: `apps/web/components/builder/__tests__/mobile-nav.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/builder/__tests__/mobile-nav.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileNav } from '../mobile-nav';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the user store
const mockResetUser = vi.fn();
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
}));

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
        resetUser: mockResetUser,
      })
    );
  });

  it('renders hamburger button', () => {
    render(<MobileNav />);

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('opens sheet when hamburger clicked', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sheet contains logo', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByText('BJJ Poster')).toBeInTheDocument();
  });

  it('sheet contains quota badge', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('sheet contains menu items', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('navigates to settings and closes sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByText('Settings'));

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('logs out and closes sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByText('Log out'));

    expect(mockResetUser).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/mobile-nav.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/mobile-nav.tsx
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
          </SheetHeader>

          <div className="border-b border-primary-800 p-4">
            <QuotaBadge />
          </div>

          <nav className="p-2">
            <Button
              variant="ghost"
              onClick={handleSettings}
              className="h-12 w-full justify-start text-white hover:bg-primary-800"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/mobile-nav.test.tsx`
Expected: PASS - all 7 tests passing

**Step 5: Commit**

```bash
git add apps/web/components/builder/mobile-nav.tsx apps/web/components/builder/__tests__/mobile-nav.test.tsx
git commit -m "feat(web): add MobileNav component with slide-in drawer"
```

---

## Task 4: BuilderHeader Component

**Files:**
- Create: `apps/web/components/builder/builder-header.tsx`
- Create: `apps/web/components/builder/__tests__/builder-header.test.tsx`

**Step 1: Write the failing tests**

```typescript
// apps/web/components/builder/__tests__/builder-header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuilderHeader } from '../builder-header';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the user store
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { name: 'John', email: 'john@example.com' },
      postersThisMonth: 2,
      postersLimit: 5,
      resetUser: vi.fn(),
    }),
}));

// Mock child components to isolate header tests
vi.mock('../quota-badge', () => ({
  QuotaBadge: () => <div data-testid="quota-badge">QuotaBadge</div>,
}));

vi.mock('../user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock('../mobile-nav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}));

describe('BuilderHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders logo linking to dashboard', () => {
    render(<BuilderHeader />);

    const logo = screen.getByRole('link', { name: /bjj poster/i });
    expect(logo).toHaveAttribute('href', '/dashboard');
  });

  it('renders quota badge on desktop', () => {
    render(<BuilderHeader />);

    expect(screen.getByTestId('quota-badge')).toBeInTheDocument();
  });

  it('renders user menu on desktop', () => {
    render(<BuilderHeader />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders mobile nav', () => {
    render(<BuilderHeader />);

    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('has solid background when not scrolled', () => {
    render(<BuilderHeader />);

    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('backdrop-blur-md');
  });

  it('has blur background when scrolled', () => {
    render(<BuilderHeader />);

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 20, writable: true });
    fireEvent.scroll(window);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('backdrop-blur-md');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/builder-header.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/builder/builder-header.tsx
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/__tests__/builder-header.test.tsx`
Expected: PASS - all 6 tests passing

**Step 5: Commit**

```bash
git add apps/web/components/builder/builder-header.tsx apps/web/components/builder/__tests__/builder-header.test.tsx
git commit -m "feat(web): add BuilderHeader component with sticky blur effect"
```

---

## Task 5: Barrel Export for Builder Components

**Files:**
- Create: `apps/web/components/builder/index.ts`

**Step 1: Create barrel export**

```typescript
// apps/web/components/builder/index.ts
export { BuilderHeader } from './builder-header';
export { QuotaBadge } from './quota-badge';
export { UserMenu } from './user-menu';
export { MobileNav } from './mobile-nav';
```

**Step 2: Run lint to verify exports**

Run: `pnpm --filter @bjj-poster/web lint`
Expected: PASS - no errors

**Step 3: Commit**

```bash
git add apps/web/components/builder/index.ts
git commit -m "chore(web): add barrel exports for builder components"
```

---

## Task 6: BuilderLayout

**Files:**
- Create: `apps/web/app/builder/layout.tsx`

**Step 1: Write the layout**

```typescript
// apps/web/app/builder/layout.tsx
import { BuilderHeader } from '@/components/builder';

interface BuilderLayoutProps {
  children: React.ReactNode;
}

export default function BuilderLayout({
  children,
}: BuilderLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-primary-950">
      <BuilderHeader />
      <main className="w-full">{children}</main>
    </div>
  );
}
```

**Step 2: Create placeholder page for testing**

```typescript
// apps/web/app/builder/page.tsx
export default function BuilderPage(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-white">Poster Builder</h1>
      <p className="mt-4 text-primary-300">Builder content will go here.</p>
    </div>
  );
}
```

**Step 3: Run dev server and manually verify**

Run: `pnpm dev`
Visit: http://localhost:3000/builder
Expected: See header with logo, quota badge, user menu. Scroll to see blur effect.

**Step 4: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`
Expected: PASS - no type errors

**Step 5: Commit**

```bash
git add apps/web/app/builder/layout.tsx apps/web/app/builder/page.tsx
git commit -m "feat(web): add BuilderLayout with header and placeholder page"
```

---

## Task 7: Run Full Test Suite and Lint

**Step 1: Run all builder tests**

Run: `pnpm --filter @bjj-poster/web test -- components/builder`
Expected: PASS - all tests passing

**Step 2: Run lint**

Run: `pnpm --filter @bjj-poster/web lint`
Expected: PASS - no errors

**Step 3: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`
Expected: PASS - no type errors

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(web): address lint and type issues"
```

---

## Summary

| Task | Component | Tests |
|------|-----------|-------|
| 1 | QuotaBadge | 5 tests |
| 2 | UserMenu | 5 tests |
| 3 | MobileNav | 7 tests |
| 4 | BuilderHeader | 6 tests |
| 5 | Barrel Export | - |
| 6 | BuilderLayout | Manual |
| 7 | Full Suite | All |

**Total: 23 automated tests**
