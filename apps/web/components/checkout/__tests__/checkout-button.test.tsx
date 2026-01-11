import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutButton } from '../checkout-button';

// Mock the checkout API
vi.mock('@/lib/api/checkout', () => ({
  createCheckoutSession: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { createCheckoutSession } from '@/lib/api/checkout';
import { toast } from 'sonner';

describe('CheckoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('renders children correctly', () => {
    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade to Pro
      </CheckoutButton>
    );

    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument();
  });

  it('shows loading state and redirects on success', async () => {
    const mockUrl = 'https://checkout.stripe.com/pay/cs_test_123';
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue({ url: mockUrl });

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading toast
    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith('Redirecting to checkout...');
    });

    // Should redirect
    await waitFor(() => {
      expect(window.location.href).toBe(mockUrl);
    });
  });

  it('shows error toast on failure', async () => {
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API error')
    );

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to start checkout. Please try again.'
      );
    });
  });

  it('disables button while loading', async () => {
    // Never resolve to keep loading
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
