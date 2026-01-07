import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePhotoUpload } from '../use-photo-upload';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  vi.clearAllMocks();
});

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('usePhotoUpload', () => {
  describe('file validation', () => {
    it('accepts valid JPEG file under 10MB', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.jpg', 5 * 1024 * 1024, 'image/jpeg');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.file).toBe(file);
      expect(result.current.preview).toBe('blob:mock-url');
    });

    it('accepts valid PNG file', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.png', 1024, 'image/png');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.file).toBe(file);
    });

    it('accepts valid HEIC file', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.heic', 1024, 'image/heic');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.file).toBe(file);
    });

    it('accepts valid HEIF file', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.heif', 1024, 'image/heif');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.file).toBe(file);
    });

    it('rejects file over 10MB', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBe('File must be under 10MB');
      expect(result.current.file).toBeNull();
      expect(result.current.preview).toBeNull();
    });

    it('rejects invalid file type', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBe('File must be JPG, PNG, or HEIC');
      expect(result.current.file).toBeNull();
    });

    it('rejects GIF files', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('animated.gif', 1024, 'image/gif');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.error).toBe('File must be JPG, PNG, or HEIC');
    });
  });

  describe('clear', () => {
    it('resets all state', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.file).not.toBeNull();

      act(() => {
        result.current.clear();
      });

      expect(result.current.file).toBeNull();
      expect(result.current.preview).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('revokes object URL on clear', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      await act(async () => {
        await result.current.handleFile(file);
      });

      act(() => {
        result.current.clear();
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('URL cleanup', () => {
    it('revokes previous URL when uploading new file', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      const file1 = createMockFile('photo1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('photo2.jpg', 1024, 'image/jpeg');

      mockCreateObjectURL.mockReturnValueOnce('blob:url-1');
      mockCreateObjectURL.mockReturnValueOnce('blob:url-2');

      await act(async () => {
        await result.current.handleFile(file1);
      });

      await act(async () => {
        await result.current.handleFile(file2);
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url-1');
      expect(result.current.preview).toBe('blob:url-2');
    });

    it('revokes URL on unmount to prevent memory leaks', async () => {
      const { result, unmount } = renderHook(() => usePhotoUpload());
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      mockCreateObjectURL.mockReturnValueOnce('blob:unmount-url');

      await act(async () => {
        await result.current.handleFile(file);
      });

      expect(result.current.preview).toBe('blob:unmount-url');

      unmount();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:unmount-url');
    });
  });
});
