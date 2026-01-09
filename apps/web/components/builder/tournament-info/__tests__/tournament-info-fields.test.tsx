import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentInfoFields, DEBOUNCE_MS } from '../tournament-info-fields';
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
  generatePoster: vi.fn(),
  loadFromPoster: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('TournamentInfoFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default state
    vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
      const state = createMockState();
      return selector ? selector(state) : state;
    });
  });

  describe('rendering', () => {
    it('renders tournament name input with label', () => {
      render(<TournamentInfoFields />);
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    it('marks tournament name as required with asterisk', () => {
      render(<TournamentInfoFields />);
      const label = screen.getByText(/tournament name/i).closest('label');
      expect(label).toHaveTextContent('*');
    });
  });

  describe('validation', () => {
    it('shows error when tournament name is empty on blur', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Tournament name is required')).toBeInTheDocument();
    });

    it('shows error when tournament name exceeds 100 characters', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'A'.repeat(101));
      await user.tab();

      expect(screen.getByText('Tournament name must be 100 characters or less')).toBeInTheDocument();
    });

    it('clears error when user types valid input', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Tournament name is required')).toBeInTheDocument();

      await user.type(input, 'IBJJF Worlds');

      expect(screen.queryByText('Tournament name is required')).not.toBeInTheDocument();
    });

    it('sets aria-invalid on input with error', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows error when location exceeds 100 characters', async () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.type(input, 'A'.repeat(101));
      await user.tab();

      expect(screen.getByText('Location must be 100 characters or less')).toBeInTheDocument();
    });

    it('does not show error for empty location (optional)', async () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.click(input);
      await user.tab();

      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  describe('collapsible section', () => {
    it('renders "Add more details" button when collapsed', () => {
      render(<TournamentInfoFields />);
      expect(screen.getByRole('button', { name: /add more details/i })).toBeInTheDocument();
    });

    it('hides date and location fields by default', () => {
      render(<TournamentInfoFields />);
      expect(screen.queryByLabelText(/date/i)).not.toBeVisible();
      expect(screen.queryByLabelText(/location/i)).not.toBeVisible();
    });

    it('calls toggleAdvancedOptions when button clicked', async () => {
      const mockToggle = vi.fn();
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ toggleAdvancedOptions: mockToggle });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      await user.click(screen.getByRole('button', { name: /add more details/i }));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('shows "Hide details" button when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByRole('button', { name: /hide details/i })).toBeInTheDocument();
    });

    it('shows date and location fields when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByLabelText(/date/i)).toBeVisible();
      expect(screen.getByLabelText(/location/i)).toBeVisible();
    });

    it('sets aria-expanded on toggle button', () => {
      render(<TournamentInfoFields />);

      const button = screen.getByRole('button', { name: /add more details/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded true when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const button = screen.getByRole('button', { name: /hide details/i });
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('store integration', () => {
    it('initializes fields from store values', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          tournament: 'IBJJF Worlds',
          date: '2026-06-15',
          location: 'Las Vegas',
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByLabelText(/tournament name/i)).toHaveValue('IBJJF Worlds');
      expect(screen.getByLabelText(/date/i)).toHaveValue('2026-06-15');
      expect(screen.getByLabelText(/location/i)).toHaveValue('Las Vegas');
    });

    it('debounces tournament name sync to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'IBJJF');

      expect(mockSetField).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockSetField).toHaveBeenCalledWith('tournament', 'IBJJF');

      vi.useRealTimers();
    });

    it('syncs date to store immediately on change', async () => {
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          setField: mockSetField,
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/date/i);
      await user.type(input, '2026-06-15');

      expect(mockSetField).toHaveBeenCalledWith('date', '2026-06-15');
    });

    it('debounces location sync to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          setField: mockSetField,
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.type(input, 'Vegas');

      expect(mockSetField).not.toHaveBeenCalledWith('location', expect.any(String));

      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockSetField).toHaveBeenCalledWith('location', 'Vegas');

      vi.useRealTimers();
    });

    it('does not sync invalid tournament name to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'A'.repeat(101));

      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockSetField).not.toHaveBeenCalledWith('tournament', expect.any(String));

      vi.useRealTimers();
    });
  });
});
