import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeSplash } from '../welcome-splash';

// Mock the hook
const mockDismiss = vi.fn();
vi.mock('../use-welcome-splash', () => ({
  useWelcomeSplash: vi.fn(() => ({
    showSplash: true,
    isLoading: false,
    dismiss: mockDismiss,
  })),
}));

// Get reference to mock for manipulation
import { useWelcomeSplash } from '../use-welcome-splash';
const mockUseWelcomeSplash = vi.mocked(useWelcomeSplash);

describe('WelcomeSplash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: true,
      isLoading: false,
      dismiss: mockDismiss,
    });
  });

  it('renders splash overlay when showSplash is true', () => {
    render(<WelcomeSplash />);

    expect(screen.getByText('BJJ Poster Builder')).toBeInTheDocument();
    expect(screen.getByText('Create Tournament Posters in 3 Steps')).toBeInTheDocument();
  });

  it('does not render when showSplash is false', () => {
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: false,
      isLoading: false,
      dismiss: mockDismiss,
    });

    render(<WelcomeSplash />);

    expect(screen.queryByText('BJJ Poster Builder')).not.toBeInTheDocument();
  });

  it('does not render while loading', () => {
    mockUseWelcomeSplash.mockReturnValue({
      showSplash: true,
      isLoading: true,
      dismiss: mockDismiss,
    });

    render(<WelcomeSplash />);

    expect(screen.queryByText('BJJ Poster Builder')).not.toBeInTheDocument();
  });

  it('calls dismiss with "builder" when CTA is clicked', () => {
    render(<WelcomeSplash />);

    fireEvent.click(screen.getByRole('button', { name: /create my first poster/i }));

    expect(mockDismiss).toHaveBeenCalledWith('builder');
  });

  it('calls dismiss with "dashboard" when skip is clicked', () => {
    render(<WelcomeSplash />);

    fireEvent.click(screen.getByRole('button', { name: /skip to dashboard/i }));

    expect(mockDismiss).toHaveBeenCalledWith('dashboard');
  });

  it('displays benefits list', () => {
    render(<WelcomeSplash />);

    expect(screen.getByText(/no design skills needed/i)).toBeInTheDocument();
    expect(screen.getByText(/professional quality/i)).toBeInTheDocument();
    expect(screen.getByText(/share instantly/i)).toBeInTheDocument();
  });

  it('displays example poster placeholders', () => {
    render(<WelcomeSplash />);

    const posters = screen.getAllByTestId('poster-placeholder');
    expect(posters).toHaveLength(3);
  });
});
