import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumFeatureStrip } from '../premium-feature-strip';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the user store with setState support for zustand
const mockState = {
  subscriptionTier: 'free' as 'free' | 'pro' | 'premium',
};

const useUserStore = {
  setState: (newState: Partial<typeof mockState>) => {
    Object.assign(mockState, newState);
  },
  getState: () => mockState,
};

vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('PremiumFeatureStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('renders for free tier users', () => {
    render(<PremiumFeatureStrip />);

    expect(screen.getByText(/HD Export/i)).toBeInTheDocument();
    expect(screen.getByText(/No Watermark/i)).toBeInTheDocument();
    expect(screen.getByText(/Background Removal/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /unlock with pro/i })
    ).toHaveAttribute('href', '/pricing');
  });

  it('does not render for pro tier users', () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    render(<PremiumFeatureStrip />);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
  });

  it('can be dismissed and stays dismissed for session', async () => {
    render(<PremiumFeatureStrip />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissButton);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
    expect(localStorageMock.getItem('premium-feature-strip-dismissed')).toBe(
      'true'
    );
  });

  it('does not render if previously dismissed', () => {
    localStorageMock.setItem('premium-feature-strip-dismissed', 'true');
    render(<PremiumFeatureStrip />);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
  });
});
