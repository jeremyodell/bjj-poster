import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutputQualityCard } from '../output-quality-card';

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

// Mock the analytics module
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

describe('OutputQualityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('renders for free tier users', () => {
    render(<OutputQualityCard />);

    expect(screen.getByText(/your poster/i)).toBeInTheDocument();
    expect(screen.getByText(/720p/i)).toBeInTheDocument();
    expect(screen.getByText(/watermarked/i)).toBeInTheDocument();
  });

  it('shows Pro and Premium upgrade options', () => {
    render(<OutputQualityCard />);

    expect(screen.getByText(/1080p HD/i)).toBeInTheDocument();
    expect(screen.getByText(/4K Ultra HD/i)).toBeInTheDocument();
  });

  it('has link to pricing page', () => {
    render(<OutputQualityCard />);

    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute(
      'href',
      '/pricing'
    );
  });

  it('does not render for pro tier users', () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    const { container } = render(<OutputQualityCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render for premium tier users', () => {
    useUserStore.setState({ subscriptionTier: 'premium' });
    const { container } = render(<OutputQualityCard />);

    expect(container).toBeEmptyDOMElement();
  });
});
