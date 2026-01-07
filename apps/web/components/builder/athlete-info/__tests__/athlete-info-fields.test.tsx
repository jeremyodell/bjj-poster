import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AthleteInfoFields } from '../athlete-info-fields';
import { usePosterBuilderStore } from '@/lib/stores';

// Mock the store
vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = {
      athleteName: '',
      beltRank: 'white',
      team: '',
      setField: vi.fn(),
    };
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
        const state = {
          athleteName: 'John Doe',
          beltRank: 'purple',
          team: 'Gracie Barra',
          setField: vi.fn(),
        };
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
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'Jane');

      // Before debounce, setField should not be called
      expect(mockSetField).not.toHaveBeenCalled();

      // Fast-forward 300ms
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetField).toHaveBeenCalledWith('athleteName', 'Jane');

      vi.useRealTimers();
    });

    it('calls setField immediately when belt rank changes', async () => {
      const user = userEvent.setup();
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
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
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.type(input, 'Alliance');

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetField).toHaveBeenCalledWith('team', 'Alliance');

      vi.useRealTimers();
    });
  });
});
