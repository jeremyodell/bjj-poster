import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreviewModal } from '../preview-modal';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

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
  loadFromPoster: vi.fn(),
      initializeForFirstVisit: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/hooks/use-templates', () => ({
  useTemplates: () => ({
    data: [{ id: 'template-1', name: 'Classic', thumbnailUrl: '/templates/classic.jpg' }],
    isLoading: false,
    error: null,
  }),
}));

describe('PreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not rendered when showPreview is false', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: false });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is rendered when showPreview is true', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: true });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls togglePreview when close button is clicked', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<PreviewModal />);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('calls togglePreview when ESC key is pressed', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        showPreview: true,
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<PreviewModal />);

    await user.keyboard('{Escape}');

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('renders PosterPreviewCanvas inside the modal', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ showPreview: true });
      return selector ? selector(state) : state;
    });

    render(<PreviewModal />);

    expect(screen.getByTestId('poster-preview-canvas')).toBeInTheDocument();
  });

  // Note: Touch/swipe gesture tests skipped due to JSDOM limitations with
  // react-remove-scroll library. Swipe-to-dismiss functionality works in real
  // browser environment but cannot be properly tested in JSDOM.
});
