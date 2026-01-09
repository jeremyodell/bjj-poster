import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterCard } from '../poster-grid/poster-card';
import type { Poster } from '@/lib/types/api';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: { src: string; alt: string; onError?: () => void }) => (
    <img src={src} alt={alt} onError={onError} {...props} />
  ),
}));

// Mock poster builder store
const mockLoadFromPoster = vi.fn();
vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: {
    getState: () => ({
      loadFromPoster: mockLoadFromPoster,
    }),
  },
}));

describe('PosterCard', () => {
  const mockPoster: Poster = {
    id: 'poster-001',
    templateId: 'tpl-001',
    createdAt: '2026-01-01T10:00:00Z',
    thumbnailUrl: '/posters/poster-001.png',
    athleteName: 'Marcus Silva',
    tournament: 'Spring Championship 2026',
    beltRank: 'Purple Belt',
    status: 'completed',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for download
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([''], { type: 'image/png' })),
    });
    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders poster thumbnail', () => {
    render(<PosterCard poster={mockPoster} />);

    const img = screen.getByRole('img', { name: mockPoster.tournament });
    expect(img).toHaveAttribute('src', mockPoster.thumbnailUrl);
  });

  it('renders tournament title', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByText(mockPoster.tournament)).toBeInTheDocument();
  });

  it('renders belt rank and formatted date', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByText(/purple belt/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 1, 2026/i)).toBeInTheDocument();
  });

  it('renders download button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('renders share button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('renders duplicate button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
  });

  it('triggers download on download button click', async () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(mockPoster.thumbnailUrl);
    });
  });

  it('opens share modal on share button click', () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(screen.getByText(/share poster/i)).toBeInTheDocument();
  });

  it('duplicates to builder on duplicate button click', () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }));

    expect(mockLoadFromPoster).toHaveBeenCalledWith({
      templateId: mockPoster.templateId,
      athleteName: mockPoster.athleteName,
      tournament: mockPoster.tournament,
      beltRank: 'purple',
    });
    expect(mockPush).toHaveBeenCalledWith('/builder');
  });

  it('shows placeholder when thumbnail fails to load', () => {
    render(<PosterCard poster={{ ...mockPoster, thumbnailUrl: '' }} />);

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument();
  });
});
