import { render, screen } from '@testing-library/react';
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
});
