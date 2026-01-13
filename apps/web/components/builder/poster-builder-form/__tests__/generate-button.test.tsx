import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateButton } from '../generate-button';
import { usePosterBuilderStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/user-store';
import { showErrorToast, trackError } from '@/lib/errors';
import { useOnlineStatus } from '@/hooks/use-online-status';

vi.mock('@/lib/errors', () => ({
  showErrorToast: vi.fn(),
  trackError: vi.fn(),
  ERROR_MESSAGES: {
    GENERATION_API_FAILURE: {
      title: 'Something went wrong',
      description: "We've been notified and are looking into it.",
      emoji: '😓',
    },
    OFFLINE: {
      title: "You're offline",
      description: 'Reconnect to continue.',
      emoji: '📡',
    },
  },
}));

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn().mockReturnValue(true),
}));

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
      initializeForFirstVisit: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

// Mock user store
const mockIncrementUsage = vi.fn();
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn((selector) =>
    selector({
      postersThisMonth: 0,
      incrementUsage: mockIncrementUsage,
    })
  ),
}));

// Mock first poster celebration hook
const mockTriggerCelebration = vi.fn();
vi.mock('@/components/onboarding', () => ({
  useFirstPosterCelebration: vi.fn(() => ({
    triggerCelebration: mockTriggerCelebration,
  })),
}));

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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
        const tooltips = screen.getAllByText(/complete all required fields/i);
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

  describe('first poster celebration', () => {
    it('triggers celebration for first poster (postersThisMonth === 0)', async () => {
      const mockGeneratePoster = vi.fn().mockResolvedValue({
        posterId: '123',
        imageUrl: '/test-poster.png',
        createdAt: new Date().toISOString(),
      });

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

      vi.mocked(useUserStore).mockImplementation((selector) =>
        selector({
          user: null,
          subscriptionTier: 'free' as const,
          postersThisMonth: 0,
          postersLimit: 3,
          setUser: vi.fn(),
          resetUser: vi.fn(),
          canCreatePoster: vi.fn().mockReturnValue(true),
          incrementUsage: mockIncrementUsage,
        })
      );

      const user = userEvent.setup();
      render(<GenerateButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockTriggerCelebration).toHaveBeenCalledWith({
          imageUrl: '/test-poster.png',
          posterId: '123',
        });
      });

      // Should NOT increment usage (celebration dismiss handles this)
      expect(mockIncrementUsage).not.toHaveBeenCalled();
      // Should NOT navigate (celebration dismiss handles this)
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates normally for subsequent posters', async () => {
      const mockGeneratePoster = vi.fn().mockResolvedValue({
        posterId: '456',
        imageUrl: '/poster.png',
        createdAt: new Date().toISOString(),
      });

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

      vi.mocked(useUserStore).mockImplementation((selector) =>
        selector({
          user: null,
          subscriptionTier: 'free' as const,
          postersThisMonth: 1,
          postersLimit: 3,
          setUser: vi.fn(),
          resetUser: vi.fn(),
          canCreatePoster: vi.fn().mockReturnValue(true),
          incrementUsage: mockIncrementUsage,
        })
      );

      const user = userEvent.setup();
      render(<GenerateButton />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockIncrementUsage).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Should NOT trigger celebration
      expect(mockTriggerCelebration).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error toast when generation fails', async () => {
      const mockGeneratePoster = vi.fn().mockRejectedValue(new Error('API Error'));
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

      await waitFor(() => {
        expect(trackError).toHaveBeenCalledWith('generation_api_failure', expect.objectContaining({
          error: 'API Error',
        }));
        expect(showErrorToast).toHaveBeenCalled();
      });
    });

    it('is disabled when offline', async () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);
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

      render(<GenerateButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows offline tooltip when offline', async () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);
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

      const user = userEvent.setup();
      render(<GenerateButton />);

      const buttonWrapper = screen.getByRole('button').parentElement;
      await user.hover(buttonWrapper!);

      await waitFor(() => {
        const tooltips = screen.getAllByText(/you're offline/i);
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });
  });
});
