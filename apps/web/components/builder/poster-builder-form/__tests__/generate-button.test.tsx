import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateButton } from '../generate-button';
import { usePosterBuilderStore } from '@/lib/stores';

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
  generatePoster: vi.fn().mockResolvedValue({ posterId: '123', imageUrl: '/poster.png', createdAt: '' }),
  loadFromPoster: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('GenerateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('disabled state', () => {
    it('is disabled when no photo is uploaded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when athlete name is empty', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when tournament is empty', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when no template is selected', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows tooltip when disabled', async () => {
      const user = userEvent.setup();
      render(<GenerateButton />);

      const buttonWrapper = screen.getByRole('button').parentElement;
      await user.hover(buttonWrapper!);

      await waitFor(() => {
        // Radix renders multiple elements for accessibility, so use getAllBy
        const tooltips = screen.getAllByText(/complete required fields/i);
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('enabled state', () => {
    beforeEach(() => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John Doe',
          beltRank: 'purple',
          tournament: 'IBJJF Worlds',
          selectedTemplateId: 'template-1',
        });
        return selector ? selector(state) : state;
      });
    });

    it('is enabled when all required fields are filled', () => {
      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('displays "Generate Poster" text', () => {
      render(<GenerateButton />);

      expect(screen.getByRole('button')).toHaveTextContent(/generate poster/i);
    });

    it('calls generatePoster on click', async () => {
      const mockGeneratePoster = vi.fn().mockResolvedValue({});
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John Doe',
          beltRank: 'purple',
          tournament: 'IBJJF Worlds',
          selectedTemplateId: 'template-1',
          generatePoster: mockGeneratePoster,
        });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<GenerateButton />);

      await user.click(screen.getByRole('button'));

      expect(mockGeneratePoster).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          isGenerating: true,
          generationProgress: 50,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows progress percentage when generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          isGenerating: true,
          generationProgress: 75,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });

    it('is disabled while generating', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athletePhoto: new File([''], 'photo.jpg'),
          athleteName: 'John',
          beltRank: 'blue',
          tournament: 'Worlds',
          selectedTemplateId: 'template-1',
          isGenerating: true,
        });
        return selector ? selector(state) : state;
      });

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
