import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TemplateSkeleton } from '../template-skeleton';

describe('TemplateSkeleton', () => {
  it('renders skeleton with correct structure', () => {
    render(<TemplateSkeleton />);

    const skeleton = screen.getByTestId('template-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders multiple skeletons when count provided', () => {
    render(<TemplateSkeleton count={3} />);

    const skeletons = screen.getAllByTestId('template-skeleton');
    expect(skeletons).toHaveLength(3);
  });
});
