import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridError } from '../poster-grid/poster-grid-error';

describe('PosterGridError', () => {
  it('renders error message', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByText(/couldn't load posters/i)).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<PosterGridError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders warning icon', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });
});
