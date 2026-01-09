import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterGrid } from '../poster-grid/poster-grid';

// Mock the hooks
const mockUsePosterHistory = vi.fn();
vi.mock('@/lib/hooks', () => ({
  usePosterHistory: () => mockUsePosterHistory(),
}));

// Mock user store
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-001' } }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock poster builder store
vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: {
    getState: () => ({
      loadFromPoster: vi.fn(),
    }),
  },
}));

describe('PosterGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when loading', () => {
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    const skeletons = screen.getAllByTestId('poster-card-skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders error state on error', () => {
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText(/couldn't load posters/i)).toBeInTheDocument();
  });

  it('calls refetch when retry clicked', () => {
    const refetch = vi.fn();
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<PosterGrid />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no posters', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText(/no posters yet/i)).toBeInTheDocument();
  });

  it('renders poster cards when data available', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [
        {
          id: 'poster-001',
          templateId: 'tpl-001',
          createdAt: '2026-01-01T10:00:00Z',
          thumbnailUrl: '/posters/poster-001.png',
          athleteName: 'Marcus Silva',
          tournament: 'Spring Championship',
          beltRank: 'Purple Belt',
          status: 'completed',
        },
        {
          id: 'poster-002',
          templateId: 'tpl-002',
          createdAt: '2026-01-02T10:00:00Z',
          thumbnailUrl: '/posters/poster-002.png',
          athleteName: 'Sofia Chen',
          tournament: 'Kids Open Mat',
          beltRank: 'Blue Belt',
          status: 'completed',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText('Spring Championship')).toBeInTheDocument();
    expect(screen.getByText('Kids Open Mat')).toBeInTheDocument();
  });

  it('renders grid with responsive columns', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [
        {
          id: 'poster-001',
          templateId: 'tpl-001',
          createdAt: '2026-01-01T10:00:00Z',
          thumbnailUrl: '/posters/poster-001.png',
          athleteName: 'Test',
          tournament: 'Test',
          beltRank: 'White Belt',
          status: 'completed',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    const grid = screen.getByTestId('poster-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});
