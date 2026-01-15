import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotaBadge } from '../quota-badge';

// Mock the user store with setState support for zustand
const mockState = {
  postersThisMonth: 0,
  postersLimit: 3,
};

const useUserStore = {
  setState: (newState: Partial<typeof mockState>) => {
    Object.assign(mockState, newState);
  },
  getState: () => mockState,
};

vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

describe('QuotaBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    useUserStore.setState({ postersThisMonth: 0, postersLimit: 3 });
  });

  it('renders the correct count', () => {
    useUserStore.setState({ postersThisMonth: 2, postersLimit: 5 });

    render(<QuotaBadge />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/used/)).toBeInTheDocument();
  });

  it('shows green dot when under 50% used', () => {
    useUserStore.setState({ postersThisMonth: 2, postersLimit: 5 });

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-emerald-500');
  });

  it('shows yellow dot when 50-80% used', () => {
    useUserStore.setState({ postersThisMonth: 3, postersLimit: 5 });

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-amber-500');
  });

  it('shows red dot when 80% or more used', () => {
    useUserStore.setState({ postersThisMonth: 4, postersLimit: 5 });

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-red-500');
  });

  it('shows red dot when at 100%', () => {
    useUserStore.setState({ postersThisMonth: 5, postersLimit: 5 });

    render(<QuotaBadge />);

    const dot = screen.getByTestId('quota-dot');
    expect(dot).toHaveClass('bg-red-500');
  });

  describe('upgrade behavior', () => {
    it('shows upgrade tooltip when usage >= 50%', async () => {
      useUserStore.setState({ postersThisMonth: 2, postersLimit: 3 });
      render(<QuotaBadge />);

      const badge = screen.getByRole('button');
      await userEvent.click(badge);

      expect(screen.getByText(/running low/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view plans/i })).toHaveAttribute('href', '/pricing');
    });

    it('shows crown icon when usage >= 80%', () => {
      useUserStore.setState({ postersThisMonth: 3, postersLimit: 3 });
      render(<QuotaBadge />);

      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('does not show upgrade UI when usage < 50%', () => {
      useUserStore.setState({ postersThisMonth: 1, postersLimit: 3 });
      render(<QuotaBadge />);

      expect(screen.queryByTestId('crown-icon')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
