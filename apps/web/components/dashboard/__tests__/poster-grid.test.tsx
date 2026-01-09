import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('PosterGrid with filter/sort', () => {
  const postersForFiltering = [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-08T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      athleteName: 'Marcus Silva',
      tournament: 'Alpha Championship',
      beltRank: 'Purple Belt',
      status: 'completed',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-05T10:00:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      athleteName: 'Sofia Chen',
      tournament: 'Beta Open',
      beltRank: 'Blue Belt',
      status: 'completed',
    },
    {
      id: 'poster-003',
      templateId: 'tpl-003',
      createdAt: '2025-12-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-003.png',
      athleteName: 'James Lee',
      tournament: 'Gamma Cup',
      beltRank: 'Black Belt',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-09T12:00:00Z'));
    mockUsePosterHistory.mockReturnValue({
      data: postersForFiltering,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders filter and sort controls when posters exist', () => {
    render(<PosterGrid />);

    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });

  it('does not render filter controls when no posters', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.queryByLabelText(/filter/i)).not.toBeInTheDocument();
  });

  it('filters posters by belt rank', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'blue' } });

    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Championship')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Cup')).not.toBeInTheDocument();
  });

  it('filters posters by recent', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'recent' } });

    expect(screen.getByText('Alpha Championship')).toBeInTheDocument();
    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.queryByText('Gamma Cup')).not.toBeInTheDocument();
  });

  it('sorts posters alphabetically', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Alpha Championship');
    expect(titles[1]).toHaveTextContent('Beta Open');
    expect(titles[2]).toHaveTextContent('Gamma Cup');
  });

  it('sorts posters by oldest', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'oldest' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Gamma Cup');
  });

  it('shows filtered empty state when no matches', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    expect(screen.getByText(/no posters match/i)).toBeInTheDocument();
  });

  it('shows clear filters button with filtered empty state', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    // Two clear buttons exist: one in FilterSort header, one in empty state
    const clearButtons = screen.getAllByRole('button', { name: /clear filters/i });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('clears filters and shows all posters', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });
    // Click the primary clear button in the empty state
    const clearButtons = screen.getAllByRole('button', { name: /clear filters/i });
    expect(clearButtons[0]).toBeDefined();
    fireEvent.click(clearButtons[0] as HTMLElement);

    expect(screen.getByText('Alpha Championship')).toBeInTheDocument();
    expect(screen.getByText('Beta Open')).toBeInTheDocument();
    expect(screen.getByText('Gamma Cup')).toBeInTheDocument();
  });

  it('combines filter and sort', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'recent' } });
    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'a-z' } });

    const grid = screen.getByTestId('poster-grid');
    const titles = within(grid).getAllByRole('heading', { level: 3 });
    expect(titles).toHaveLength(2);
    expect(titles[0]).toHaveTextContent('Alpha Championship');
    expect(titles[1]).toHaveTextContent('Beta Open');
  });

  it('keeps filter controls visible when filtered empty', () => {
    render(<PosterGrid />);

    fireEvent.change(screen.getByLabelText(/filter/i), { target: { value: 'white' } });

    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });
});
