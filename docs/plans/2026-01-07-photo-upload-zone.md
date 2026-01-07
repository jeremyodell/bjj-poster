# Photo Upload Zone Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a photo upload component with drag-and-drop, inline cropping, and validation for the poster builder.

**Architecture:** Single `PhotoUploadZone` component orchestrates three states (empty/loading/preview). `usePhotoUpload` hook handles file validation and URL management. `UploadDropzone` renders empty state with drag-and-drop. `ImageCropper` renders preview with react-image-crop overlay.

**Tech Stack:** React, react-image-crop, Zustand, Vitest, Testing Library, Tailwind CSS, lucide-react icons

---

## Task 1: Install react-image-crop

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install dependency**

```bash
pnpm --filter @bjj-poster/web add react-image-crop
```

**Step 2: Verify installation**

```bash
pnpm --filter @bjj-poster/web list react-image-crop
```

Expected: Shows `react-image-crop` in dependencies

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add react-image-crop dependency"
```

---

## Task 2: Create usePhotoUpload Hook - Validation Tests

**Files:**
- Create: `apps/web/components/builder/photo-upload/use-photo-upload.ts`
- Create: `apps/web/components/builder/photo-upload/__tests__/use-photo-upload.test.ts`

**Step 1: Write failing tests for file validation**

```typescript
// apps/web/components/builder/photo-upload/__tests__/use-photo-upload.test.ts
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

function createMockFile(
  name: string,
  size: number,
  type: string
): File {
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
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/use-photo-upload.test.ts
```

Expected: FAIL - module not found

**Step 3: Write minimal hook implementation**

```typescript
// apps/web/components/builder/photo-upload/use-photo-upload.ts
import { useState, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface UsePhotoUploadReturn {
  file: File | null;
  preview: string | null;
  error: string | null;
  isLoading: boolean;
  handleFile: (file: File) => Promise<void>;
  clear: () => void;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (newFile: File): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file type
      if (!ALLOWED_TYPES.includes(newFile.type)) {
        setError('File must be JPG, PNG, or HEIC');
        setFile(null);
        setPreview(null);
        return;
      }

      // Validate file size
      if (newFile.size > MAX_SIZE_BYTES) {
        setError('File must be under 10MB');
        setFile(null);
        setPreview(null);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(newFile);
      setFile(newFile);
      setPreview(previewUrl);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback((): void => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setIsLoading(false);
  }, [preview]);

  return { file, preview, error, isLoading, handleFile, clear };
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/use-photo-upload.test.ts
```

Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add usePhotoUpload hook with validation"
```

---

## Task 3: Add usePhotoUpload Hook - Clear and Cleanup Tests

**Files:**
- Modify: `apps/web/components/builder/photo-upload/__tests__/use-photo-upload.test.ts`
- Modify: `apps/web/components/builder/photo-upload/use-photo-upload.ts`

**Step 1: Add tests for clear and URL cleanup**

Add to the test file:

```typescript
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
  });
```

**Step 2: Run tests to verify new tests fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/use-photo-upload.test.ts
```

Expected: New "revokes previous URL" test fails

**Step 3: Update hook to revoke previous URL**

Update `handleFile` in `use-photo-upload.ts`:

```typescript
  const handleFile = useCallback(async (newFile: File): Promise<void> => {
    setError(null);
    setIsLoading(true);

    // Revoke previous preview URL to prevent memory leaks
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    try {
      // Validate file type
      if (!ALLOWED_TYPES.includes(newFile.type)) {
        setError('File must be JPG, PNG, or HEIC');
        setFile(null);
        setPreview(null);
        return;
      }

      // Validate file size
      if (newFile.size > MAX_SIZE_BYTES) {
        setError('File must be under 10MB');
        setFile(null);
        setPreview(null);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(newFile);
      setFile(newFile);
      setPreview(previewUrl);
    } finally {
      setIsLoading(false);
    }
  }, [preview]);
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/use-photo-upload.test.ts
```

Expected: All 9 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add clear and URL cleanup to usePhotoUpload"
```

---

## Task 4: Create UploadDropzone Component - Basic Render Tests

**Files:**
- Create: `apps/web/components/builder/photo-upload/upload-dropzone.tsx`
- Create: `apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx`

**Step 1: Write failing tests for basic rendering**

```typescript
// apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
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
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write minimal component implementation**

```typescript
// apps/web/components/builder/photo-upload/upload-dropzone.tsx
'use client';

import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  error: string | null;
  isLoading: boolean;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  error,
  isLoading,
  className,
}: UploadDropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = (): void => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          'border-primary-600 bg-primary-900/50 hover:border-primary-400 hover:bg-primary-900/70',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-950',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500'
        )}
      >
        {isLoading ? (
          <>
            <Loader2
              data-testid="loading-spinner"
              className="h-12 w-12 animate-spin text-primary-400"
            />
            <p className="mt-4 text-sm text-primary-300">Processing...</p>
          </>
        ) : (
          <>
            <Upload
              data-testid="upload-icon"
              className="h-12 w-12 text-primary-400"
            />
            <p className="mt-4 text-sm text-primary-200">
              Tap to upload or drag photo here
            </p>
            <p className="mt-2 text-xs text-primary-400">
              JPG, PNG, HEIC - Max 10MB
            </p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept="image/jpeg,image/png,image/heic"
        onChange={handleInputChange}
        className="sr-only"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
```

Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add UploadDropzone component"
```

---

## Task 5: Add UploadDropzone - File Selection and Drag-and-Drop Tests

**Files:**
- Modify: `apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx`
- Modify: `apps/web/components/builder/photo-upload/upload-dropzone.tsx`

**Step 1: Add tests for file selection and drag-and-drop**

Add to the test file:

```typescript
  describe('file selection', () => {
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
    it('shows drag active state on dragover', async () => {
      render(<UploadDropzone {...defaultProps} />);

      const dropzone = screen.getByRole('button');

      // Simulate dragenter
      await userEvent.pointer({
        target: dropzone,
        keys: '[MouseLeft>]',
      });

      // For drag events we need to use fireEvent
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.dragEnter(dropzone);

      expect(dropzone).toHaveClass('border-primary-400');
    });

    it('calls onFileSelect when file is dropped', async () => {
      const { fireEvent } = await import('@testing-library/react');
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
```

**Step 2: Run tests to verify new tests fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
```

Expected: Drag-and-drop tests fail

**Step 3: Add drag-and-drop handlers**

Update `upload-dropzone.tsx`:

```typescript
'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  error: string | null;
  isLoading: boolean;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  error,
  isLoading,
  className,
}: UploadDropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleClick = (): void => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        disabled={isLoading}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          'border-primary-600 bg-primary-900/50 hover:border-primary-400 hover:bg-primary-900/70',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-950',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDragActive && 'border-primary-400 bg-primary-900/70',
          error && 'border-red-500'
        )}
      >
        {isLoading ? (
          <>
            <Loader2
              data-testid="loading-spinner"
              className="h-12 w-12 animate-spin text-primary-400"
            />
            <p className="mt-4 text-sm text-primary-300">Processing...</p>
          </>
        ) : (
          <>
            <Upload
              data-testid="upload-icon"
              className="h-12 w-12 text-primary-400"
            />
            <p className="mt-4 text-sm text-primary-200">
              Tap to upload or drag photo here
            </p>
            <p className="mt-2 text-xs text-primary-400">
              JPG, PNG, HEIC - Max 10MB
            </p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept="image/jpeg,image/png,image/heic"
        onChange={handleInputChange}
        className="sr-only"
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
```

Expected: All 11 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add drag-and-drop to UploadDropzone"
```

---

## Task 6: Create ImageCropper Component - Basic Render Tests

**Files:**
- Create: `apps/web/components/builder/photo-upload/image-cropper.tsx`
- Create: `apps/web/components/builder/photo-upload/__tests__/image-cropper.test.tsx`

**Step 1: Write failing tests for basic rendering**

```typescript
// apps/web/components/builder/photo-upload/__tests__/image-cropper.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ImageCropper } from '../image-cropper';

// Mock react-image-crop since it needs actual DOM measurements
vi.mock('react-image-crop', () => ({
  default: ({ children, onChange }: { children: React.ReactNode; onChange: (crop: unknown) => void }) => (
    <div data-testid="react-crop-wrapper">
      {children}
      <button
        data-testid="mock-crop-change"
        onClick={() => onChange({ x: 10, y: 10, width: 100, height: 100, unit: 'px' })}
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

      expect(screen.getByRole('button', { name: /apply crop/i })).toBeInTheDocument();
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
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/image-cropper.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write minimal component implementation**

```typescript
// apps/web/components/builder/photo-upload/image-cropper.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ImageCropperProps {
  preview: string;
  onCropComplete: (croppedFile: File) => void;
  onRemove: () => void;
  className?: string;
}

export function ImageCropper({
  preview,
  onCropComplete,
  onRemove,
  className,
}: ImageCropperProps): JSX.Element {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const handleCropComplete = useCallback(
    async (): Promise<void> => {
      if (!imgRef.current || !completedCrop) {
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-photo.jpg', {
            type: 'image/jpeg',
          });
          onCropComplete(croppedFile);
        }
      }, 'image/jpeg');
    },
    [completedCrop, onCropComplete]
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="overflow-hidden rounded-lg bg-primary-900">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
        >
          <img
            ref={imgRef}
            src={preview}
            alt="Photo preview"
            className="max-h-80 w-full object-contain"
          />
        </ReactCrop>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCropComplete} className="flex-1">
          Apply Crop
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/image-cropper.test.tsx
```

Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add ImageCropper component"
```

---

## Task 7: Create PhotoUploadZone Main Component

**Files:**
- Create: `apps/web/components/builder/photo-upload/photo-upload-zone.tsx`
- Create: `apps/web/components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx`

**Step 1: Write failing tests**

```typescript
// apps/web/components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx
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

      expect(screen.getByText(/tap to upload or drag photo here/i)).toBeInTheDocument();
    });
  });

  describe('file selection flow', () => {
    it('shows preview after valid file is selected', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadZone />);

      const input = screen.getByTestId('file-input');
      const file = createMockFile('photo.jpg', 'image/jpeg');

      await user.upload(input, file);

      expect(screen.getByRole('img', { name: /photo preview/i })).toBeInTheDocument();
    });

    it('shows error for invalid file type', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadZone />);

      const input = screen.getByTestId('file-input');
      const file = createMockFile('doc.pdf', 'application/pdf');

      await user.upload(input, file);

      expect(screen.getByText('File must be JPG, PNG, or HEIC')).toBeInTheDocument();
    });
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

      expect(screen.getByText(/tap to upload or drag photo here/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write main component implementation**

```typescript
// apps/web/components/builder/photo-upload/photo-upload-zone.tsx
'use client';

import { useCallback } from 'react';
import { usePosterBuilderStore } from '@/lib/stores';
import { usePhotoUpload } from './use-photo-upload';
import { UploadDropzone } from './upload-dropzone';
import { ImageCropper } from './image-cropper';
import { cn } from '@/lib/utils';

export interface PhotoUploadZoneProps {
  className?: string;
}

export function PhotoUploadZone({ className }: PhotoUploadZoneProps): JSX.Element {
  const setPhoto = usePosterBuilderStore((state) => state.setPhoto);
  const { file, preview, error, isLoading, handleFile, clear } = usePhotoUpload();

  const handleCropComplete = useCallback(
    (croppedFile: File): void => {
      setPhoto(croppedFile);
    },
    [setPhoto]
  );

  const handleRemove = useCallback((): void => {
    clear();
    setPhoto(null);
  }, [clear, setPhoto]);

  return (
    <div className={cn('w-full', className)}>
      {preview ? (
        <ImageCropper
          preview={preview}
          onCropComplete={handleCropComplete}
          onRemove={handleRemove}
        />
      ) : (
        <UploadDropzone
          onFileSelect={handleFile}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx
```

Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/
git commit -m "feat(web): add PhotoUploadZone main component"
```

---

## Task 8: Add Barrel Export and Update Builder Index

**Files:**
- Create: `apps/web/components/builder/photo-upload/index.ts`
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Create barrel export for photo-upload**

```typescript
// apps/web/components/builder/photo-upload/index.ts
export { PhotoUploadZone } from './photo-upload-zone';
export { UploadDropzone } from './upload-dropzone';
export { ImageCropper } from './image-cropper';
export { usePhotoUpload } from './use-photo-upload';
export type { PhotoUploadZoneProps } from './photo-upload-zone';
export type { UploadDropzoneProps } from './upload-dropzone';
export type { ImageCropperProps } from './image-cropper';
export type { UsePhotoUploadReturn } from './use-photo-upload';
```

**Step 2: Update builder index to include photo-upload exports**

```typescript
// apps/web/components/builder/index.ts
export { BuilderHeader } from './builder-header';
export { QuotaBadge } from './quota-badge';
export { UserMenu } from './user-menu';
export { MobileNav } from './mobile-nav';
export {
  PhotoUploadZone,
  UploadDropzone,
  ImageCropper,
  usePhotoUpload,
} from './photo-upload';
export type {
  PhotoUploadZoneProps,
  UploadDropzoneProps,
  ImageCropperProps,
  UsePhotoUploadReturn,
} from './photo-upload';
```

**Step 3: Verify type-check passes**

```bash
pnpm --filter @bjj-poster/web type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/components/builder/
git commit -m "feat(web): add barrel exports for PhotoUploadZone"
```

---

## Task 9: Run All Tests and Lint

**Step 1: Run all photo-upload tests**

```bash
pnpm --filter @bjj-poster/web test -- components/builder/photo-upload/
```

Expected: All tests PASS

**Step 2: Run lint**

```bash
pnpm --filter @bjj-poster/web lint
```

Expected: No errors

**Step 3: Run type-check**

```bash
pnpm --filter @bjj-poster/web type-check
```

Expected: No errors

**Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix(web): address lint and type issues" --allow-empty
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Install react-image-crop | N/A |
| 2 | usePhotoUpload validation | 6 |
| 3 | usePhotoUpload clear/cleanup | 3 |
| 4 | UploadDropzone basic render | 7 |
| 5 | UploadDropzone drag-and-drop | 4 |
| 6 | ImageCropper | 4 |
| 7 | PhotoUploadZone | 4 |
| 8 | Barrel exports | Type-check |
| 9 | Final verification | All |

**Total: 28+ tests**
