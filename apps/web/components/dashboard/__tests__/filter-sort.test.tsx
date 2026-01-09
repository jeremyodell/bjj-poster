import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSort } from '../poster-grid/filter-sort';

describe('FilterSort', () => {
  const defaultProps = {
    filter: 'all' as const,
    sort: 'newest' as const,
    onFilterChange: vi.fn(),
    onSortChange: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders filter select with correct value', () => {
    render(<FilterSort {...defaultProps} filter="recent" />);

    const filterSelect = screen.getByLabelText(/filter/i);
    expect(filterSelect).toHaveValue('recent');
  });

  it('renders sort select with correct value', () => {
    render(<FilterSort {...defaultProps} sort="oldest" />);

    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toHaveValue('oldest');
  });

  it('renders all filter options', () => {
    render(<FilterSort {...defaultProps} />);

    const filterSelect = screen.getByLabelText(/filter/i);
    expect(filterSelect).toContainHTML('All');
    expect(filterSelect).toContainHTML('Recent');
    expect(filterSelect).toContainHTML('White Belt');
    expect(filterSelect).toContainHTML('Blue Belt');
    expect(filterSelect).toContainHTML('Purple Belt');
    expect(filterSelect).toContainHTML('Brown Belt');
    expect(filterSelect).toContainHTML('Black Belt');
  });

  it('renders all sort options', () => {
    render(<FilterSort {...defaultProps} />);

    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toContainHTML('Newest');
    expect(sortSelect).toContainHTML('Oldest');
    expect(sortSelect).toContainHTML('A-Z');
  });

  it('calls onFilterChange when filter changes', () => {
    const onFilterChange = vi.fn();
    render(<FilterSort {...defaultProps} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'purple' } });

    expect(onFilterChange).toHaveBeenCalledWith('purple');
  });

  it('calls onSortChange when sort changes', () => {
    const onSortChange = vi.fn();
    render(<FilterSort {...defaultProps} onSortChange={onSortChange} />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    expect(onSortChange).toHaveBeenCalledWith('a-z');
  });

  it('hides clear button when no active filters', () => {
    render(<FilterSort {...defaultProps} filter="all" sort="newest" />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows clear button when filter is active', () => {
    render(<FilterSort {...defaultProps} filter="purple" />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('shows clear button when sort is not default', () => {
    render(<FilterSort {...defaultProps} sort="oldest" />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    render(<FilterSort {...defaultProps} filter="purple" onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
