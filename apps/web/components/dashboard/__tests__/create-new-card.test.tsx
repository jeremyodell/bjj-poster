import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateNewCard } from '../create-new-card';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CreateNewCard', () => {
  it('renders the create card with link to builder', () => {
    render(<CreateNewCard />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/builder');
  });

  it('displays the create new poster text', () => {
    render(<CreateNewCard />);

    expect(screen.getByText(/create new poster/i)).toBeInTheDocument();
  });

  it('displays a description', () => {
    render(<CreateNewCard />);

    expect(screen.getByText(/championship-worthy/i)).toBeInTheDocument();
  });

  it('has an accessible call-to-action', () => {
    render(<CreateNewCard />);

    // Should have the plus icon indicator
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
