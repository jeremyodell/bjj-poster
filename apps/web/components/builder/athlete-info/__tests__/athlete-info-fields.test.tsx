import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AthleteInfoFields } from '../athlete-info-fields';

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
});
