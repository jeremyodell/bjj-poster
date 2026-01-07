import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotoUploadZone } from '../photo-upload-zone';

// Mock the Zustand store
const mockSetPhoto = vi.fn();
vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: (selector: (state: unknown) => unknown) =>
    selector({
      setPhoto: mockSetPhoto,
    }),
}));

// Mock react-image-crop
vi.mock('react-image-crop', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-crop-wrapper">{children}</div>
  ),
}));

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

function createMockFile(name: string, type: string): File {
  return new File(['test'], name, { type });
}

describe('PhotoUploadZone', () => {
  describe('empty state', () => {
    it('renders upload dropzone initially', () => {
      render(<PhotoUploadZone />);

      expect(
        screen.getByText(/tap to upload or drag photo here/i)
      ).toBeInTheDocument();
    });
  });

  describe('file selection flow', () => {
    it('shows preview after valid file is selected', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadZone />);

      const input = screen.getByTestId('file-input');
      const file = createMockFile('photo.jpg', 'image/jpeg');

      await user.upload(input, file);

      expect(
        screen.getByRole('img', { name: /photo preview/i })
      ).toBeInTheDocument();
    });

    // Note: Invalid file type validation is tested in usePhotoUpload.test.ts
    // and error display is tested in upload-dropzone.test.tsx
  });

  describe('remove flow', () => {
    it('returns to empty state when Remove is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadZone />);

      // Upload a file first
      const input = screen.getByTestId('file-input');
      const file = createMockFile('photo.jpg', 'image/jpeg');
      await user.upload(input, file);

      // Click remove
      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(
        screen.getByText(/tap to upload or drag photo here/i)
      ).toBeInTheDocument();
    });

    it('clears photo from store when Remove is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadZone />);

      // Upload a file first
      const input = screen.getByTestId('file-input');
      const file = createMockFile('photo.jpg', 'image/jpeg');
      await user.upload(input, file);

      // Click remove
      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(mockSetPhoto).toHaveBeenCalledWith(null);
    });
  });
});
