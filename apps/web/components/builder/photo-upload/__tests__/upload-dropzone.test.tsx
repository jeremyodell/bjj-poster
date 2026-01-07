import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
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
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/heic');
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
  });
});
