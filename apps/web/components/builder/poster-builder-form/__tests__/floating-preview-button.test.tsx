import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloatingPreviewButton } from '../floating-preview-button';
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
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('FloatingPreviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not rendered when no form data exists', () => {
    render(<FloatingPreviewButton />);

    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
  });

  it('is rendered when any form field has data', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('is rendered when photo is uploaded', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athletePhoto: new File([''], 'photo.jpg') });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('is rendered when template is selected', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ selectedTemplateId: 'template-1' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('calls togglePreview on click', async () => {
    const mockTogglePreview = vi.fn();
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        athleteName: 'John',
        togglePreview: mockTogglePreview,
      });
      return selector ? selector(state) : state;
    });

    const user = userEvent.setup();
    render(<FloatingPreviewButton />);

    await user.click(screen.getByRole('button', { name: /preview/i }));

    expect(mockTogglePreview).toHaveBeenCalled();
  });

  it('has fixed positioning at bottom-right', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    const button = screen.getByRole('button', { name: /preview/i });
    expect(button.parentElement).toHaveClass('fixed');
  });

  it('shows eye icon', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({ athleteName: 'John' });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('shows pulse animation when all required fields are valid', () => {
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState({
        athletePhoto: new File([''], 'photo.jpg'),
        athleteName: 'John Doe',
        beltRank: 'purple',
        tournament: 'Worlds',
        selectedTemplateId: 'template-1',
      });
      return selector ? selector(state) : state;
    });

    render(<FloatingPreviewButton />);

    const button = screen.getByRole('button', { name: /preview/i });
    expect(button).toHaveClass('animate-pulse-subtle');
  });
});
