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
  QuotaBadge: ({ className }: { className?: string }) => (
    <div data-testid="quota-badge" className={className}>
      QuotaBadge
    </div>
  ),
}));

vi.mock('../user-menu', () => ({
  UserMenu: ({ className }: { className?: string }) => (
    <div data-testid="user-menu" className={className}>
      UserMenu
    </div>
  ),
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

  it('has accessible aria-label on back link', () => {
    render(<BuilderHeader />);

    const backLink = screen.getByRole('link', { name: /go back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
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
