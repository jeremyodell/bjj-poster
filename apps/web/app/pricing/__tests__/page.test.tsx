import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PricingPage from '../page';

describe('Pricing Page', () => {
  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<PricingPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /pricing/i })
      ).toBeInTheDocument();
    });

    it('renders a subheading', () => {
      render(<PricingPage />);
      expect(screen.getByText(/choose the plan/i)).toBeInTheDocument();
    });

    it('renders main landmark', () => {
      render(<PricingPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Billing Toggle', () => {
    it('renders monthly and annual options', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radio', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /annual/i })).toBeInTheDocument();
    });

    it('has monthly selected by default', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radio', { name: /monthly/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /annual/i })).not.toBeChecked();
    });

    it('shows save 20% badge on annual option', () => {
      render(<PricingPage />);
      expect(screen.getByText(/save 20%/i)).toBeInTheDocument();
    });

    it('switches to annual when clicked', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      expect(screen.getByRole('radio', { name: /annual/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /monthly/i })).not.toBeChecked();
    });

    it('has proper radiogroup accessibility', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radiogroup', { name: /billing period/i })).toBeInTheDocument();
    });
  });

  describe('Pricing Cards', () => {
    it('renders three pricing tiers', () => {
      render(<PricingPage />);
      expect(screen.getByRole('heading', { level: 2, name: /free/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /pro/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /premium/i })).toBeInTheDocument();
    });

    it('shows Most Popular badge on Pro tier', () => {
      render(<PricingPage />);
      expect(screen.getByText(/most popular/i)).toBeInTheDocument();
    });

    it('renders monthly prices by default', () => {
      render(<PricingPage />);
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('shows /month text for all tiers', () => {
      render(<PricingPage />);
      const monthTexts = screen.getAllByText(/\/month/i);
      expect(monthTexts.length).toBe(3);
    });
  });

  describe('Price Toggle Behavior', () => {
    it('updates prices when switching to annual', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      // Verify monthly prices first
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();

      // Switch to annual
      await user.click(screen.getByRole('radio', { name: /annual/i }));

      // Verify annual prices
      expect(screen.getByText('$7.99')).toBeInTheDocument();
      expect(screen.getByText('$23.99')).toBeInTheDocument();
    });

    it('shows "Billed annually" text when annual is selected', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      expect(screen.queryByText(/billed annually/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      // Pro and Premium should show billed annually (Free is $0)
      const billedAnnually = screen.getAllByText(/billed annually/i);
      expect(billedAnnually.length).toBe(2);
    });

    it('Free tier price stays $0 for both periods', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      expect(screen.getByText('$0')).toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });
});
