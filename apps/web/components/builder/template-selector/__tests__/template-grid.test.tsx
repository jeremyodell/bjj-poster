import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TemplateGrid } from '../template-grid';

describe('TemplateGrid', () => {
  it('renders children in a grid layout', () => {
    render(
      <TemplateGrid>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </TemplateGrid>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies grid classes for responsive layout', () => {
    render(
      <TemplateGrid>
        <div>Child</div>
      </TemplateGrid>
    );

    const grid = screen.getByTestId('template-grid');
    expect(grid).toHaveClass('grid');
  });
});
