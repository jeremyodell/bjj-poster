import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../page';

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

// Mock WelcomeSplash to avoid localStorage in tests
vi.mock('@/components/onboarding', () => ({
  WelcomeSplash: () => <div data-testid="welcome-splash">WelcomeSplash</div>,
}));

// Mock UpgradeSuccessHandler to avoid next/navigation in tests
vi.mock('@/components/checkout', () => ({
  UpgradeSuccessHandler: () => <div data-testid="upgrade-handler">UpgradeSuccessHandler</div>,
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John Doe', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
        subscriptionTier: 'free',
      })
    );
  });

  describe('Page Structure', () => {
    it('renders main landmark', () => {
      render(<DashboardPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders the welcome section', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('renders the WelcomeSplash component', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('welcome-splash')).toBeInTheDocument();
    });

    it('renders the create new poster card', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/create new poster/i)).toBeInTheDocument();
    });

    it('has link to builder page', () => {
      render(<DashboardPage />);
      const builderLink = screen.getByRole('link', { name: /create new poster/i });
      expect(builderLink).toHaveAttribute('href', '/builder');
    });
  });

  describe('Content Sections', () => {
    it('renders recent posters section heading', () => {
      render(<DashboardPage />);
      expect(screen.getByRole('heading', { name: /your posters/i })).toBeInTheDocument();
    });
  });
});
