import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Bebas_Neue: () => ({ variable: '--font-bebas-neue' }),
  Outfit: () => ({ variable: '--font-outfit' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains-mono' }),
}));

// Mock Providers
vi.mock('../providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RootLayout from '../layout';

describe('RootLayout', () => {
  it('renders skip-to-content link', () => {
    render(
      <RootLayout>
        <main id="main-content">Content</main>
      </RootLayout>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('skip link has correct focus styles', () => {
    render(
      <RootLayout>
        <main id="main-content">Content</main>
      </RootLayout>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveClass('sr-only');
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });
});
