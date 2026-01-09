import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageCard } from '../usage-card';

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

describe('UsageCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('progress bar fill', () => {
    it('shows 0% width when no posters used', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 0,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('shows 33% width when 1 of 3 posters used', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '33.33333333333333%' });
    });

    it('shows 100% width when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('caps at 100% when over limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 5,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('color thresholds', () => {
    it('shows green (emerald) when under 50%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 4,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-emerald-500');
    });

    it('shows yellow (amber) when at 50%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 5,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('shows yellow (amber) when between 50-80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 7,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('shows red when at 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('shows red when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 10,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-red-500');
    });
  });

  describe('usage display', () => {
    it('displays X / Y format for free tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/posters used/i)).toBeInTheDocument();
    });

    it('displays remaining count for pro tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 20,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText(/12 remaining/i)).toBeInTheDocument();
    });

    it('displays UNLIMITED for premium tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 50,
          postersLimit: -1,
          subscriptionTier: 'premium',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
      expect(screen.queryByTestId('usage-progress')).not.toBeInTheDocument();
    });

    it('shows limit reached message when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText(/limit reached/i)).toBeInTheDocument();
    });
  });

  describe('upgrade CTA', () => {
    it('shows upgrade CTA for free user at 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 10,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toHaveAttribute('href', '/pricing');
    });

    it('shows upgrade CTA for free user at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toBeInTheDocument();
    });

    it('hides upgrade CTA for free user under 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('hides upgrade CTA for pro users', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 18,
          postersLimit: 20,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('hides upgrade CTA for premium users', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 100,
          postersLimit: -1,
          subscriptionTier: 'premium',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });
  });
});
