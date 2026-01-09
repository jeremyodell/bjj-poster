import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareModal } from '../poster-grid/share-modal';

describe('ShareModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    posterUrl: 'https://example.com/posters/123',
    posterTitle: 'Spring Championship',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders when open', () => {
    render(<ShareModal {...defaultProps} />);

    expect(screen.getByText(/share poster/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShareModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/share poster/i)).not.toBeInTheDocument();
  });

  it('renders all share buttons', () => {
    render(<ShareModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /instagram/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
  });

  it('copies link to clipboard and shows feedback', async () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/posters/123'
    );

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key pressed', () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error state when clipboard write fails', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      },
    });

    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('has correct Facebook share URL', () => {
    render(<ShareModal {...defaultProps} />);

    const fbLink = screen.getByRole('link', { name: /facebook/i });
    expect(fbLink).toHaveAttribute(
      'href',
      expect.stringContaining('facebook.com/sharer')
    );
  });

  it('has correct Twitter share URL', () => {
    render(<ShareModal {...defaultProps} />);

    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    expect(twitterLink).toHaveAttribute(
      'href',
      expect.stringContaining('twitter.com/intent/tweet')
    );
  });
});
