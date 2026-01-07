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
