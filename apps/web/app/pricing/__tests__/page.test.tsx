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
});
