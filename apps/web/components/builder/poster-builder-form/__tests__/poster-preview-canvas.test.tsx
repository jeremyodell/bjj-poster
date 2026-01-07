import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterPreviewCanvas } from '../poster-preview-canvas';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock URL.createObjectURL
const mockObjectUrl = 'blob:mock-url';
global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
global.URL.revokeObjectURL = vi.fn();

// Mock the store
const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  generatePoster: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

// Mock useTemplates hook
vi.mock('@/lib/hooks/use-templates', () => ({
  useTemplates: () => ({
    data: [
      { id: 'template-1', name: 'Classic', thumbnailUrl: '/templates/classic.jpg' },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PosterPreviewCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with 3:4 aspect ratio container', () => {
    render(<PosterPreviewCanvas />);

    const container = screen.getByTestId('poster-preview-canvas');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('aspect-[3/4]');
  });

  it('shows placeholder when no template is selected', () => {
    render(<PosterPreviewCanvas />);

    expect(screen.getByTestId('template-placeholder')).toBeInTheDocument();
  });

  it('shows template background when template is selected', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ selectedTemplateId: 'template-1' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const templateBg = screen.getByTestId('template-background');
    expect(templateBg).toBeInTheDocument();
  });

  it('shows photo placeholder when no photo uploaded', () => {
    render(<PosterPreviewCanvas />);

    expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('shows athlete photo when uploaded', () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: mockFile });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const photo = screen.getByTestId('athlete-photo');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', mockObjectUrl);
  });

  it('displays athlete name when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John Doe' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays belt rank with correct color class', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ beltRank: 'purple' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    const beltIndicator = screen.getByTestId('belt-indicator');
    expect(beltIndicator).toHaveClass('bg-purple-600');
  });

  it('displays tournament name when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ tournament: 'IBJJF Worlds 2026' });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('IBJJF Worlds 2026')).toBeInTheDocument();
  });

  it('displays date and location when provided', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        date: '2026-03-15',
        location: 'Irvine, CA',
      });
      return selector ? selector(state) : state;
    });

    render(<PosterPreviewCanvas />);

    expect(screen.getByText('2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('Irvine, CA')).toBeInTheDocument();
  });

  it('cleans up object URL on unmount', () => {
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });

    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: mockFile });
      return selector ? selector(state) : state;
    });

    const { unmount } = render(<PosterPreviewCanvas />);
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });
});
