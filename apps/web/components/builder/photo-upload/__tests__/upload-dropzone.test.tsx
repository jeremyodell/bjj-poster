import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadDropzone } from '../upload-dropzone';

describe('UploadDropzone', () => {
  const defaultProps = {
    onFileSelect: vi.fn(),
    error: null,
    isLoading: false,
  };

  describe('rendering', () => {
    it('renders upload prompt text', () => {
      render(<UploadDropzone {...defaultProps} />);

      expect(screen.getByText(/tap to upload or drag photo here/i)).toBeInTheDocument();
    });

    it('renders accepted formats hint', () => {
      render(<UploadDropzone {...defaultProps} />);

      expect(screen.getByText(/jpg, png, heic/i)).toBeInTheDocument();
      expect(screen.getByText(/max 10mb/i)).toBeInTheDocument();
    });

    it('renders upload icon', () => {
      render(<UploadDropzone {...defaultProps} />);

      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('renders hidden file input', () => {
      render(<UploadDropzone {...defaultProps} />);

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveAttribute(
        'accept',
        'image/jpeg,image/png,image/heic,image/heif'
      );
      expect(input).toHaveClass('sr-only');
    });
  });

  describe('error state', () => {
    it('displays error message when error prop is set', () => {
      render(<UploadDropzone {...defaultProps} error="File must be under 10MB" />);

      expect(screen.getByText('File must be under 10MB')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<UploadDropzone {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('hides upload prompt when loading', () => {
      render(<UploadDropzone {...defaultProps} isLoading={true} />);

      expect(screen.queryByText(/tap to upload/i)).not.toBeInTheDocument();
    });

    it('announces loading state to screen readers', () => {
      render(<UploadDropzone {...defaultProps} isLoading={true} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent(/processing image/i);
    });
  });

  describe('file selection', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('triggers file input when clicked', async () => {
      const user = userEvent.setup();
      const onFileSelect = vi.fn();
      render(<UploadDropzone {...defaultProps} onFileSelect={onFileSelect} />);

      const input = screen.getByTestId('file-input');
      const clickSpy = vi.spyOn(input, 'click');

      const button = screen.getByRole('button');
      await user.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('calls onFileSelect when file is selected', async () => {
      const onFileSelect = vi.fn();
      render(<UploadDropzone {...defaultProps} onFileSelect={onFileSelect} />);

      const input = screen.getByTestId('file-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file);

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('drag and drop', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows drag active state on dragenter', () => {
      render(<UploadDropzone {...defaultProps} />);

      const dropzone = screen.getByRole('button');

      fireEvent.dragEnter(dropzone);

      expect(dropzone).toHaveClass('border-primary-400');
    });

    it('removes drag active state on dragleave', () => {
      render(<UploadDropzone {...defaultProps} />);

      const dropzone = screen.getByRole('button');

      fireEvent.dragEnter(dropzone);
      expect(dropzone).toHaveClass('border-primary-400');

      fireEvent.dragLeave(dropzone);
      expect(dropzone).toHaveClass('border-primary-600');
    });

    it('calls onFileSelect when file is dropped', () => {
      const onFileSelect = vi.fn();
      render(<UploadDropzone {...defaultProps} onFileSelect={onFileSelect} />);

      const dropzone = screen.getByRole('button');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });
});
