import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Providers } from '../providers';
import * as useOnlineStatusModule from '@/hooks/use-online-status';

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn(),
}));

describe('Providers', () => {
  it('renders children', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(true);

    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('includes OfflineBanner when offline', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(
      <Providers>
        <div>Content</div>
      </Providers>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('does not show OfflineBanner when online', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(true);

    render(
      <Providers>
        <div>Content</div>
      </Providers>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
