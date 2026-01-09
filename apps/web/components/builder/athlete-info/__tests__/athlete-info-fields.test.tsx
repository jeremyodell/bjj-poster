import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AthleteInfoFields, DEBOUNCE_MS } from '../athlete-info-fields';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock the store - include all required state properties
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

describe('AthleteInfoFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders athlete name input with label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/athlete name/i)).toBeInTheDocument();
    });

    it('renders belt rank select with label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/belt rank/i)).toBeInTheDocument();
    });

    it('renders team input with optional label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
      expect(screen.getByText(/optional/i)).toBeInTheDocument();
    });

    it('marks required fields with asterisk', () => {
      render(<AthleteInfoFields />);

      const athleteLabel = screen.getByText(/athlete name/i).closest('label');
      const beltLabel = screen.getByText(/belt rank/i).closest('label');

      expect(athleteLabel).toHaveTextContent('*');
      expect(beltLabel).toHaveTextContent('*');
    });

    it('renders belt rank dropdown with all 7 belt options', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      // Open the dropdown
      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));

      // Check all options are present
      expect(screen.getByRole('option', { name: /white/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /blue/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /purple/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /brown/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^black$/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /red\/black/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^red$/i })).toBeInTheDocument();
    });

    it('renders color indicator for each belt option', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));

      // Check color indicators exist
      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option.querySelector('[data-testid="belt-color"]')).toBeInTheDocument();
      });
    });
  });

  describe('store integration', () => {
    it('initializes fields from store values', () => {
      // Override mock for this test
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          athleteName: 'John Doe',
          beltRank: 'purple' as const,
          team: 'Gracie Barra',
        });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/athlete name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/team/i)).toHaveValue('Gracie Barra');
    });

    it('calls setField when athlete name changes after debounce', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'Jane');

      // Before debounce, setField should not be called
      expect(mockSetField).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockSetField).toHaveBeenCalledWith('athleteName', 'Jane');

      vi.useRealTimers();
    });

    it('calls setField immediately when belt rank changes', async () => {
      const user = userEvent.setup();
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));
      await user.click(screen.getByRole('option', { name: /purple/i }));

      expect(mockSetField).toHaveBeenCalledWith('beltRank', 'purple');
    });

    it('calls setField when team changes after debounce', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.type(input, 'Alliance');

      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockSetField).toHaveBeenCalledWith('team', 'Alliance');

      vi.useRealTimers();
    });

    it('does not sync invalid data to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      // Type 51 characters (exceeds max length)
      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'A'.repeat(51));

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      // setField should NOT be called with invalid data
      expect(mockSetField).not.toHaveBeenCalledWith('athleteName', expect.any(String));

      vi.useRealTimers();
    });

    it('cleans up debounce timers on unmount', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      const { unmount } = render(<AthleteInfoFields />);

      // Type something
      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'Jane');

      // Unmount before debounce completes
      unmount();

      // Advance timers past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // setField should NOT be called after unmount (timer was cleaned up)
      expect(mockSetField).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('only syncs final value during rapid typing', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);

      // Type rapidly - each keystroke resets the debounce timer
      await user.type(input, 'J');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await user.type(input, 'o');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await user.type(input, 'h');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await user.type(input, 'n');

      // No sync yet - debounce hasn't completed
      expect(mockSetField).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await act(async () => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      // Only the final value should be synced
      expect(mockSetField).toHaveBeenCalledTimes(1);
      expect(mockSetField).toHaveBeenCalledWith('athleteName', 'John');

      vi.useRealTimers();
    });
  });

  describe('validation', () => {
    it('shows error when athlete name is empty on blur', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab(); // Blur

      expect(screen.getByText('Athlete name is required')).toBeInTheDocument();
    });

    it('shows error when athlete name exceeds 50 characters', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'A'.repeat(51));
      await user.tab();

      expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
    });

    it('clears error when user starts typing valid input', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Athlete name is required')).toBeInTheDocument();

      await user.type(input, 'John');

      expect(screen.queryByText('Athlete name is required')).not.toBeInTheDocument();
    });

    it('shows error when team exceeds 50 characters', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.type(input, 'A'.repeat(51));
      await user.tab();

      expect(screen.getByText('Team must be 50 characters or less')).toBeInTheDocument();
    });

    it('does not show error for empty team (optional)', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.click(input);
      await user.tab();

      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });

    it('sets aria-invalid on input with error', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('Athlete name is required');
    });

    it('shows errors for multiple invalid fields simultaneously', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const teamInput = screen.getByLabelText(/team/i);

      // Leave name empty, trigger blur
      await user.click(nameInput);
      await user.tab();

      // Add too-long team
      await user.type(teamInput, 'A'.repeat(51));
      await user.tab();

      // Both errors should be visible
      expect(screen.getByText('Athlete name is required')).toBeInTheDocument();
      expect(screen.getByText('Team must be 50 characters or less')).toBeInTheDocument();

      // Both inputs should have aria-invalid
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(teamInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
