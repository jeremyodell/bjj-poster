import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterBuilderForm } from '../poster-builder-form';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock error utilities
vi.mock('@/lib/errors', () => ({
  showErrorToast: vi.fn(),
  trackError: vi.fn(),
  ERROR_MESSAGES: {
    GENERATION_TIMEOUT: {
      title: 'Taking longer than usual',
      description: "We'll email you when your poster is ready!",
      emoji: '⏱️',
    },
  },
}));

// Mock all child components
vi.mock('@/components/builder', () => ({
  PhotoUploadZone: () => <div data-testid="photo-upload-zone">Photo Upload</div>,
  AthleteInfoFields: () => <div data-testid="athlete-info-fields">Athlete Info</div>,
  TournamentInfoFields: () => <div data-testid="tournament-info-fields">Tournament Info</div>,
  TemplateSelector: () => <div data-testid="template-selector">Template Selector</div>,
}));

vi.mock('../generate-button', () => ({
  GenerateButton: () => <div data-testid="generate-button">Generate Button</div>,
}));

vi.mock('../floating-preview-button', () => ({
  FloatingPreviewButton: () => <div data-testid="floating-preview-button">Preview Button</div>,
}));

vi.mock('../preview-modal', () => ({
  PreviewModal: () => <div data-testid="preview-modal">Preview Modal</div>,
}));

vi.mock('../generation-loading-screen', () => ({
  GenerationLoadingScreen: ({ progress }: { progress: number }) => (
    <div data-testid="generation-loading-screen" role="dialog" aria-label="Generating poster">
      Loading: {progress}%
    </div>
  ),
}));

// Mock the poster builder store
const mockUsePosterBuilderStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: (selector: (state: unknown) => unknown) => mockUsePosterBuilderStore(selector),
}));

// Mock onboarding components
vi.mock('@/components/onboarding', () => ({
  GuidedTooltips: () => <div data-testid="guided-tooltips">Guided Tooltips</div>,
  useBuilderTour: () => ({
    showTour: false,
    isLoading: false,
    completeTour: vi.fn(),
    skipTour: vi.fn(),
  }),
  FirstPosterCelebration: () => <div data-testid="first-poster-celebration">Celebration</div>,
}));

const defaultStoreState = {
  initializeForFirstVisit: vi.fn(),
  isGenerating: false,
  generationProgress: 0,
};

describe('PosterBuilderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePosterBuilderStore.mockImplementation((selector) =>
      selector(defaultStoreState)
    );
  });

  it('renders PhotoUploadZone', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
  });

  it('renders AthleteInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('athlete-info-fields')).toBeInTheDocument();
  });

  it('renders TournamentInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('tournament-info-fields')).toBeInTheDocument();
  });

  it('renders TemplateSelector', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
  });

  it('renders GenerateButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
  });

  it('renders FloatingPreviewButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('floating-preview-button')).toBeInTheDocument();
  });

  it('renders PreviewModal', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('preview-modal')).toBeInTheDocument();
  });

  it('has sticky bottom container for generate button on mobile', () => {
    render(<PosterBuilderForm />);

    const generateButtonWrapper = screen.getByTestId('generate-button-wrapper');
    expect(generateButtonWrapper).toHaveClass('sticky');
    expect(generateButtonWrapper).toHaveClass('bottom-0');
  });

  it('shows loading screen when isGenerating is true', () => {
    mockUsePosterBuilderStore.mockImplementation((selector) =>
      selector({
        ...defaultStoreState,
        isGenerating: true,
        generationProgress: 45,
      })
    );

    render(<PosterBuilderForm />);

    expect(screen.getByRole('dialog', { name: /generating poster/i })).toBeInTheDocument();
    expect(screen.getByText('Loading: 45%')).toBeInTheDocument();
  });

  it('hides loading screen when isGenerating is false', () => {
    mockUsePosterBuilderStore.mockImplementation((selector) =>
      selector({
        ...defaultStoreState,
        isGenerating: false,
        generationProgress: 0,
      })
    );

    render(<PosterBuilderForm />);

    expect(screen.queryByRole('dialog', { name: /generating poster/i })).not.toBeInTheDocument();
  });
});
