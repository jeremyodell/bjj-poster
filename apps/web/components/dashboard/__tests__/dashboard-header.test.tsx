import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardHeader } from '../dashboard-header';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
}));

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        postersThisMonth: 2,
        postersLimit: 5,
        user: { name: 'John', email: 'john@example.com' },
        resetUser: vi.fn(),
      })
    );
  });

  it('renders the logo with link to home', () => {
    render(<DashboardHeader />);

    const logoLink = screen.getByRole('link', { name: /bjj poster/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the header with banner role', () => {
    render(<DashboardHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the quota badge on desktop', () => {
    render(<DashboardHeader />);

    // QuotaBadge should be present (hidden on mobile via CSS)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders create button linking to builder', () => {
    render(<DashboardHeader />);

    const createLink = screen.getByRole('link', { name: /create/i });
    expect(createLink).toHaveAttribute('href', '/builder');
  });
});
