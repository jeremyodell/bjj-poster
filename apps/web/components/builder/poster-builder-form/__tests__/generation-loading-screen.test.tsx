import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenerationLoadingScreen } from '../generation-loading-screen';

describe('GenerationLoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading screen with progress', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders belt animation icon', () => {
    render(<GenerationLoadingScreen progress={0} />);

    expect(screen.getByTestId('belt-animation')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    render(<GenerationLoadingScreen progress={75} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');

    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveStyle({ width: '75%' });
  });

  it('renders progress bar at 0%', () => {
    render(<GenerationLoadingScreen progress={0} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders progress bar at 100%', () => {
    render(<GenerationLoadingScreen progress={100} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('displays a tip on initial render', () => {
    render(<GenerationLoadingScreen progress={50} />);

    // Should show the first tip
    expect(screen.getByText(/pro tip|did you know|upgrade to pro|premium users/i)).toBeInTheDocument();
  });

  it('rotates tips every 5 seconds', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByText(/pro tip: remove backgrounds/i)).toBeInTheDocument();

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should now show second tip
    expect(screen.getByText(/did you know\? pro users get hd/i)).toBeInTheDocument();

    // Advance another 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should now show third tip
    expect(screen.getByText(/upgrade to pro to remove watermarks/i)).toBeInTheDocument();
  });

  it('cycles tips back to first after last tip', () => {
    render(<GenerationLoadingScreen progress={50} />);

    // Advance through all 5 tips (25 seconds)
    act(() => {
      vi.advanceTimersByTime(25000);
    });

    // Should be back to first tip
    expect(screen.getByText(/pro tip: remove backgrounds/i)).toBeInTheDocument();
  });

  it('displays initial time estimate', () => {
    render(<GenerationLoadingScreen progress={0} />);

    expect(screen.getByText(/usually takes 15-20 seconds/i)).toBeInTheDocument();
  });

  it('updates time estimate after 20 seconds', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByText(/usually takes 15-20 seconds/i)).toBeInTheDocument();

    // Advance 20 seconds
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByText(/almost done! a few more seconds/i)).toBeInTheDocument();
    expect(screen.queryByText(/usually takes 15-20 seconds/i)).not.toBeInTheDocument();
  });
});
