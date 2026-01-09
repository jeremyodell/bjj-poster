import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeSection } from '../welcome-section';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
  UNLIMITED: -1,
}));

describe('WelcomeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays welcome message with user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John Doe', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
        subscriptionTier: 'free',
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  it('displays generic welcome when no user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: null,
        postersThisMonth: 0,
        postersLimit: 3,
        subscriptionTier: 'free',
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('displays usage indicator with correct values', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
        subscriptionTier: 'pro',
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/posters used/i)).toBeInTheDocument();
  });

  it('shows upgrade CTA for free users approaching limit', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 3,
        subscriptionTier: 'free',
      })
    );

    render(<WelcomeSection />);

    const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
    expect(upgradeLink).toHaveAttribute('href', '/pricing');
  });

  it('hides upgrade CTA for pro users', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 10,
        postersLimit: 20,
        subscriptionTier: 'pro',
      })
    );

    render(<WelcomeSection />);

    expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
  });

  it('shows unlimited badge for premium users', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 50,
        postersLimit: -1,
        subscriptionTier: 'premium',
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
  });

  it('displays progress bar with correct percentage', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 4,
        subscriptionTier: 'free',
      })
    );

    render(<WelcomeSection />);

    const progressBar = screen.getByTestId('usage-progress');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });
});
