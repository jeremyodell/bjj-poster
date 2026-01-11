import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { UpgradeSuccessHandler } from '../upgrade-success-handler';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard',
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

describe('UpgradeSuccessHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success toast when upgrade=success', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: (key: string) => (key === 'upgrade' ? 'success' : null),
    });

    render(<UpgradeSuccessHandler />);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Welcome'),
        expect.any(Object)
      );
    });

    // Should clear URL params
    expect(mockReplace).toHaveBeenCalled();
  });

  it('shows info toast when upgrade=cancelled', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: (key: string) => (key === 'upgrade' ? 'cancelled' : null),
    });

    render(<UpgradeSuccessHandler />);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        expect.any(Object)
      );
    });
  });

  it('does nothing when no upgrade param', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => null,
    });

    render(<UpgradeSuccessHandler />);

    // Wait a tick to ensure effect runs
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  it('renders nothing visible', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => null,
    });

    const { container } = render(<UpgradeSuccessHandler />);
    expect(container).toBeEmptyDOMElement();
  });
});
