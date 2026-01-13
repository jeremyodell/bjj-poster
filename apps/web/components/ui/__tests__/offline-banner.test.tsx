import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../offline-banner';
import * as useOnlineStatusModule from '@/hooks/use-online-status';

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn(),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when online', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(true);

    const { container } = render(<OfflineBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders banner when offline', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('displays reconnect message', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByText(/reconnect to generate posters/i)).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
  });
});
