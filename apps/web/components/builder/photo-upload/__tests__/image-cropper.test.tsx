import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ImageCropper } from '../image-cropper';

// Mock react-image-crop since it needs actual DOM measurements
vi.mock('react-image-crop', () => ({
  default: ({
    children,
    onChange,
  }: {
    children: React.ReactNode;
    onChange: (crop: unknown) => void;
  }) => (
    <div data-testid="react-crop-wrapper">
      {children}
      <button
        data-testid="mock-crop-change"
        onClick={() =>
          onChange({ x: 10, y: 10, width: 100, height: 100, unit: 'px' })
        }
      >
        Mock Crop
      </button>
    </div>
  ),
}));

describe('ImageCropper', () => {
  const defaultProps = {
    preview: 'blob:test-preview-url',
    onCropComplete: vi.fn(),
    onRemove: vi.fn(),
  };

  describe('rendering', () => {
    it('renders image with preview URL', () => {
      render(<ImageCropper {...defaultProps} />);

      const img = screen.getByRole('img', { name: /photo preview/i });
      expect(img).toHaveAttribute('src', 'blob:test-preview-url');
    });

    it('renders Apply Crop button', () => {
      render(<ImageCropper {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /apply crop/i })
      ).toBeInTheDocument();
    });

    it('renders Remove button', () => {
      render(<ImageCropper {...defaultProps} />);

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onRemove when Remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<ImageCropper {...defaultProps} onRemove={onRemove} />);

      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(onRemove).toHaveBeenCalled();
    });

    it('shows error when Apply Crop clicked without crop selection', async () => {
      const user = userEvent.setup();
      render(<ImageCropper {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /apply crop/i }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Please select a crop area first.'
      );
    });

    it('calls onError callback when crop fails', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      render(<ImageCropper {...defaultProps} onError={onError} />);

      await user.click(screen.getByRole('button', { name: /apply crop/i }));

      expect(onError).toHaveBeenCalledWith('Please select a crop area first.');
    });
  });
});
