import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridFilteredEmpty } from '../poster-grid/poster-grid-filtered-empty';

describe('PosterGridFilteredEmpty', () => {
  it('renders empty state message', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByText(/no posters match/i)).toBeInTheDocument();
  });

  it('renders clear filters button', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('calls onClear when button clicked', () => {
    const onClear = vi.fn();
    render(<PosterGridFilteredEmpty onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('renders search icon', () => {
    render(<PosterGridFilteredEmpty onClear={vi.fn()} />);

    expect(screen.getByTestId('filtered-empty-icon')).toBeInTheDocument();
  });
});
