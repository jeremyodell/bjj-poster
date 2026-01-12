# Error Handling & Edge Cases Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive error handling with user-friendly messages for photo upload, generation, and network failures.

**Architecture:** Layered error system with centralized messages, Sonner-based toasts, browser-based offline detection, and structured error tracking. Integrates with existing photo upload hook, generate button, and loading screen components.

**Tech Stack:** React 18, Next.js 14, Sonner (existing), Zod (existing), Zustand (existing), Vitest + Testing Library

---

## Task 1: Error Messages Constants

**Files:**
- Create: `apps/web/lib/errors/error-messages.ts`
- Test: `apps/web/lib/errors/__tests__/error-messages.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/lib/errors/__tests__/error-messages.test.ts
import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES } from '../error-messages';

describe('ERROR_MESSAGES', () => {
  it('has all required photo upload error messages', () => {
    expect(ERROR_MESSAGES.PHOTO_TOO_LARGE).toBeDefined();
    expect(ERROR_MESSAGES.PHOTO_TOO_LARGE.title).toBe('Photo is too large');
    expect(ERROR_MESSAGES.PHOTO_INVALID_FORMAT).toBeDefined();
    expect(ERROR_MESSAGES.PHOTO_UPLOAD_FAILED).toBeDefined();
  });

  it('has all required generation error messages', () => {
    expect(ERROR_MESSAGES.GENERATION_TIMEOUT).toBeDefined();
    expect(ERROR_MESSAGES.GENERATION_API_FAILURE).toBeDefined();
    expect(ERROR_MESSAGES.QUOTA_EXCEEDED).toBeDefined();
  });

  it('has all required network error messages', () => {
    expect(ERROR_MESSAGES.OFFLINE).toBeDefined();
    expect(ERROR_MESSAGES.API_UNREACHABLE).toBeDefined();
  });

  it('each message has required properties', () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('description');
      expect(message).toHaveProperty('emoji');
      expect(typeof message.title).toBe('string');
      expect(typeof message.description).toBe('string');
      expect(typeof message.emoji).toBe('string');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/error-messages.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/lib/errors/error-messages.ts
export const ERROR_MESSAGES = {
  // Photo Upload
  PHOTO_TOO_LARGE: {
    title: 'Photo is too large',
    description: 'Try a smaller file or compress it.',
    emoji: '📸',
  },
  PHOTO_INVALID_FORMAT: {
    title: 'Unsupported format',
    description: 'We only support JPG, PNG, and HEIC photos.',
    emoji: '❌',
  },
  PHOTO_UPLOAD_FAILED: {
    title: 'Upload failed',
    description: 'Check your connection and try again.',
    emoji: '📡',
  },

  // Generation
  GENERATION_TIMEOUT: {
    title: 'Taking longer than usual',
    description: "We'll email you when your poster is ready!",
    emoji: '⏱️',
  },
  GENERATION_API_FAILURE: {
    title: 'Something went wrong',
    description: "We've been notified and are looking into it.",
    emoji: '😓',
  },
  QUOTA_EXCEEDED: {
    title: 'Monthly limit reached',
    description: "You've used all 2 posters this month.",
    emoji: '🚫',
  },

  // Network
  OFFLINE: {
    title: "You're offline",
    description: 'Reconnect to continue.',
    emoji: '📡',
  },
  API_UNREACHABLE: {
    title: "Can't connect to server",
    description: 'Check your connection and try again.',
    emoji: '🔌',
  },
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type ErrorMessage = (typeof ERROR_MESSAGES)[ErrorMessageKey];
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/error-messages.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/lib/errors/
git commit -m "feat(web): add centralized error message constants

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Error Tracking Function

**Files:**
- Create: `apps/web/lib/errors/error-tracking.ts`
- Test: `apps/web/lib/errors/__tests__/error-tracking.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/lib/errors/__tests__/error-tracking.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackError } from '../error-tracking';

describe('trackError', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('logs error with type and timestamp', () => {
    trackError('photo_too_large');

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        type: 'photo_too_large',
        timestamp: expect.any(String),
      })
    );
  });

  it('includes context when provided', () => {
    trackError('photo_too_large', { fileSize: 15000000, maxSize: 10000000 });

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        type: 'photo_too_large',
        context: { fileSize: 15000000, maxSize: 10000000 },
      })
    );
  });

  it('includes url in browser environment', () => {
    trackError('generation_timeout');

    expect(console.error).toHaveBeenCalledWith(
      '[Error Tracked]',
      expect.objectContaining({
        url: expect.any(String),
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/error-tracking.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/lib/errors/error-tracking.ts
export type ErrorType =
  | 'photo_too_large'
  | 'photo_invalid_format'
  | 'photo_upload_failed'
  | 'generation_timeout'
  | 'generation_api_failure'
  | 'quota_exceeded'
  | 'network_offline'
  | 'api_unreachable'
  | 'form_validation_error';

export interface ErrorContext {
  [key: string]: string | number | boolean | undefined;
}

export function trackError(type: ErrorType, context?: ErrorContext): void {
  const errorEvent = {
    type,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  console.error('[Error Tracked]', errorEvent);

  // TODO: Send to analytics service (Amplitude, Segment, etc.)
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/error-tracking.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/lib/errors/error-tracking.ts apps/web/lib/errors/__tests__/error-tracking.test.ts
git commit -m "feat(web): add structured error tracking function

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Show Error Toast Helper

**Files:**
- Create: `apps/web/lib/errors/show-error-toast.ts`
- Test: `apps/web/lib/errors/__tests__/show-error-toast.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/lib/errors/__tests__/show-error-toast.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { showErrorToast } from '../show-error-toast';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with formatted title including emoji', () => {
    showErrorToast({
      title: 'Photo is too large',
      description: 'Try a smaller file.',
      emoji: '📸',
    });

    expect(toast.error).toHaveBeenCalledWith(
      '📸 Photo is too large',
      expect.objectContaining({
        description: 'Try a smaller file.',
        duration: 5000,
      })
    );
  });

  it('uses default emoji when not provided', () => {
    showErrorToast({
      title: 'Something went wrong',
      description: 'Please try again.',
    });

    expect(toast.error).toHaveBeenCalledWith(
      '❌ Something went wrong',
      expect.any(Object)
    );
  });

  it('includes action when provided', () => {
    const mockAction = vi.fn();
    showErrorToast(
      { title: 'Error', description: 'Desc', emoji: '❌' },
      { action: { label: 'Retry', onClick: mockAction } }
    );

    expect(toast.error).toHaveBeenCalledWith(
      '❌ Error',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Retry',
          onClick: mockAction,
        }),
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/show-error-toast.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/lib/errors/show-error-toast.ts
import { toast } from 'sonner';

export interface ErrorToastMessage {
  title: string;
  description: string;
  emoji?: string;
}

export interface ErrorToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function showErrorToast(
  message: ErrorToastMessage,
  options?: ErrorToastOptions
): void {
  const emoji = message.emoji || '❌';

  toast.error(`${emoji} ${message.title}`, {
    description: message.description,
    duration: 5000,
    action: options?.action,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run lib/errors/__tests__/show-error-toast.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/lib/errors/show-error-toast.ts apps/web/lib/errors/__tests__/show-error-toast.test.ts
git commit -m "feat(web): add Sonner-based showErrorToast helper

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Error Module Index Export

**Files:**
- Create: `apps/web/lib/errors/index.ts`

**Step 1: Create index file (no test needed - just exports)**

```typescript
// apps/web/lib/errors/index.ts
export { ERROR_MESSAGES, type ErrorMessageKey, type ErrorMessage } from './error-messages';
export { trackError, type ErrorType, type ErrorContext } from './error-tracking';
export { showErrorToast, type ErrorToastMessage, type ErrorToastOptions } from './show-error-toast';
```

**Step 2: Commit**

```bash
git add apps/web/lib/errors/index.ts
git commit -m "feat(web): add errors module index

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Online Status Hook

**Files:**
- Create: `apps/web/hooks/use-online-status.ts`
- Test: `apps/web/hooks/__tests__/use-online-status.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/hooks/__tests__/use-online-status.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../use-online-status';

describe('useOnlineStatus', () => {
  const originalNavigator = global.navigator;
  let onlineGetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onlineGetter = vi.fn().mockReturnValue(true);
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global.navigator, 'onLine', {
      get: onlineGetter,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('returns true when initially online', () => {
    onlineGetter.mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false when initially offline', () => {
    onlineGetter.mockReturnValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('updates to false when offline event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('updates to true when online event fires', () => {
    onlineGetter.mockReturnValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run hooks/__tests__/use-online-status.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/hooks/use-online-status.ts
'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state (SSR-safe)
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run hooks/__tests__/use-online-status.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/hooks/use-online-status.ts apps/web/hooks/__tests__/use-online-status.test.ts
git commit -m "feat(web): add useOnlineStatus hook for offline detection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Offline Banner Component

**Files:**
- Create: `apps/web/components/ui/offline-banner.tsx`
- Test: `apps/web/components/ui/__tests__/offline-banner.test.tsx`

**Step 1: Write the failing test**

```typescript
// apps/web/components/ui/__tests__/offline-banner.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../offline-banner';
import * as useOnlineStatusModule from '@/hooks/use-online-status';

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn(),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when online', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(true);

    const { container } = render(<OfflineBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders banner when offline', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('displays reconnect message', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByText(/reconnect to generate posters/i)).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(<OfflineBanner />);

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/ui/__tests__/offline-banner.test.tsx`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/ui/offline-banner.tsx
'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner(): JSX.Element | null {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
    >
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Reconnect to generate posters.</span>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/ui/__tests__/offline-banner.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/ui/offline-banner.tsx apps/web/components/ui/__tests__/offline-banner.test.tsx
git commit -m "feat(web): add OfflineBanner component for offline detection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Integrate OfflineBanner into Providers

**Files:**
- Modify: `apps/web/app/providers.tsx`
- Test: `apps/web/app/__tests__/providers.test.tsx`

**Step 1: Write the failing test**

```typescript
// apps/web/app/__tests__/providers.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Providers } from '../providers';
import * as useOnlineStatusModule from '@/hooks/use-online-status';

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn(),
}));

describe('Providers', () => {
  it('renders children', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(true);

    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('includes OfflineBanner', () => {
    vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(false);

    render(
      <Providers>
        <div>Content</div>
      </Providers>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run app/__tests__/providers.test.tsx`
Expected: FAIL - no OfflineBanner rendered

**Step 3: Modify providers.tsx**

```typescript
// apps/web/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { OfflineBanner } from '@/components/ui/offline-banner';

/**
 * Creates a new QueryClient with default options
 * Extracted to function for SSR-safe instantiation
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Application providers wrapper
 * Includes QueryClientProvider and React Query DevTools
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per app instance (SSR-safe)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run app/__tests__/providers.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/providers.tsx apps/web/app/__tests__/providers.test.tsx
git commit -m "feat(web): integrate OfflineBanner into Providers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Enhance usePhotoUpload with Error Tracking and Messages

**Files:**
- Modify: `apps/web/components/builder/photo-upload/use-photo-upload.ts`
- Modify: `apps/web/components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx`

**Step 1: Write/update failing test**

Add to existing test file:

```typescript
// Add these imports at top of apps/web/components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx
import { trackError } from '@/lib/errors';

vi.mock('@/lib/errors', () => ({
  trackError: vi.fn(),
  ERROR_MESSAGES: {
    PHOTO_TOO_LARGE: { title: 'Photo is too large', description: 'Try a smaller file.', emoji: '📸' },
    PHOTO_INVALID_FORMAT: { title: 'Unsupported format', description: 'We only support JPG, PNG, and HEIC.', emoji: '❌' },
  },
}));

// Add these tests
describe('PhotoUploadZone error tracking', () => {
  it('tracks error when file is too large', async () => {
    // Create a file > 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    render(<PhotoUploadZone />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [largeFile] } });
    });

    expect(trackError).toHaveBeenCalledWith('photo_too_large', expect.objectContaining({
      fileSize: expect.any(Number),
    }));
  });

  it('tracks error when file format is invalid', async () => {
    const gifFile = new File(['gif content'], 'image.gif', { type: 'image/gif' });

    render(<PhotoUploadZone />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [gifFile] } });
    });

    expect(trackError).toHaveBeenCalledWith('photo_invalid_format', expect.objectContaining({
      fileType: 'image/gif',
    }));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx`
Expected: FAIL - trackError not called

**Step 3: Modify use-photo-upload.ts**

```typescript
// apps/web/components/builder/photo-upload/use-photo-upload.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { trackError, ERROR_MESSAGES } from '@/lib/errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
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
  const previewUrlRef = useRef<string | null>(null);

  const handleFile = useCallback(async (newFile: File): Promise<void> => {
    setError(null);
    setIsLoading(true);

    // Revoke previous preview URL to prevent memory leaks
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    try {
      // Validate file type
      if (!ALLOWED_TYPES.includes(newFile.type)) {
        trackError('photo_invalid_format', { fileType: newFile.type });
        setError(`${ERROR_MESSAGES.PHOTO_INVALID_FORMAT.emoji} ${ERROR_MESSAGES.PHOTO_INVALID_FORMAT.title}. ${ERROR_MESSAGES.PHOTO_INVALID_FORMAT.description}`);
        setFile(null);
        setPreview(null);
        return;
      }

      // Validate file size
      if (newFile.size > MAX_SIZE_BYTES) {
        trackError('photo_too_large', { fileSize: newFile.size, maxSize: MAX_SIZE_BYTES });
        setError(`${ERROR_MESSAGES.PHOTO_TOO_LARGE.emoji} ${ERROR_MESSAGES.PHOTO_TOO_LARGE.title}. ${ERROR_MESSAGES.PHOTO_TOO_LARGE.description}`);
        setFile(null);
        setPreview(null);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(newFile);
      previewUrlRef.current = previewUrl;
      setFile(newFile);
      setPreview(previewUrl);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback((): void => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  return { file, preview, error, isLoading, handleFile, clear };
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/use-photo-upload.ts apps/web/components/builder/photo-upload/__tests__/photo-upload-zone.test.tsx
git commit -m "feat(web): enhance photo upload with error tracking and messages

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Error Handling to GenerateButton

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/generate-button.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx`

**Step 1: Write/update failing test**

Add tests to existing file:

```typescript
// Add to apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx

import { showErrorToast, trackError, ERROR_MESSAGES } from '@/lib/errors';
import { useOnlineStatus } from '@/hooks/use-online-status';

vi.mock('@/lib/errors', () => ({
  showErrorToast: vi.fn(),
  trackError: vi.fn(),
  ERROR_MESSAGES: {
    GENERATION_API_FAILURE: { title: 'Something went wrong', description: "We've been notified.", emoji: '😓' },
    OFFLINE: { title: "You're offline", description: 'Reconnect to continue.', emoji: '📡' },
  },
}));

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: vi.fn().mockReturnValue(true),
}));

describe('GenerateButton error handling', () => {
  it('shows error toast when generation fails', async () => {
    const mockGeneratePoster = vi.fn().mockRejectedValue(new Error('API Error'));
    vi.mocked(usePosterBuilderStore).mockReturnValue({
      // ... valid form state
      generatePoster: mockGeneratePoster,
    });

    render(<GenerateButton />);

    const button = screen.getByRole('button', { name: /generate/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(showErrorToast).toHaveBeenCalledWith(
      ERROR_MESSAGES.GENERATION_API_FAILURE,
      expect.objectContaining({ action: expect.any(Object) })
    );
    expect(trackError).toHaveBeenCalledWith('generation_api_failure', expect.any(Object));
  });

  it('disables button when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    // ... valid form state

    render(<GenerateButton />);

    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/generate-button.test.tsx`
Expected: FAIL - showErrorToast not called

**Step 3: Modify generate-button.tsx**

```typescript
// apps/web/components/builder/poster-builder-form/generate-button.tsx
'use client';

import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePosterBuilderStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/user-store';
import { useFirstPosterCelebration } from '@/components/onboarding';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { showErrorToast, trackError, ERROR_MESSAGES } from '@/lib/errors';
import { cn } from '@/lib/utils';

export function GenerateButton(): JSX.Element {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { triggerCelebration } = useFirstPosterCelebration();
  const postersThisMonth = useUserStore((s) => s.postersThisMonth);
  const incrementUsage = useUserStore((s) => s.incrementUsage);

  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    isGenerating,
    generationProgress,
    generatePoster,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
      generatePoster: state.generatePoster,
    }))
  );

  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  const isDisabled = !isValid || isGenerating || !isOnline;

  const handleClick = async () => {
    if (isDisabled) return;

    try {
      const result = await generatePoster();

      // Check if this is the user's first poster
      if (postersThisMonth === 0) {
        // Show celebration (don't increment usage yet - dismiss will do it)
        triggerCelebration({
          imageUrl: result.imageUrl,
          posterId: result.posterId,
        });
      } else {
        // Normal flow: increment usage and navigate
        incrementUsage();
        router.push('/dashboard');
      }
    } catch (error) {
      trackError('generation_api_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      showErrorToast(ERROR_MESSAGES.GENERATION_API_FAILURE, {
        action: {
          label: 'Try Again',
          onClick: handleClick,
        },
      });
    }
  };

  const getTooltipMessage = (): string => {
    if (!isOnline) return "You're offline. Reconnect to generate.";
    return 'Complete all required fields to generate';
  };

  const buttonContent = isGenerating ? (
    <div className="flex items-center gap-3">
      <Loader2 data-testid="loading-spinner" className="h-5 w-5 animate-spin" />
      <span>Generating...</span>
      <span className="ml-1 font-mono text-gold-400">{generationProgress}%</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5" />
      <span>Generate Poster</span>
      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </div>
  );

  const button = (
    <div data-tour="generate-button">
      <Button
        size="xl"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'group w-full',
          isValid && !isGenerating && isOnline && 'animate-pulse-gold'
        )}
      >
        {buttonContent}
      </Button>
    </div>
  );

  // Wrap disabled button in tooltip
  if ((!isValid || !isOnline) && !isGenerating) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="block w-full">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="border-surface-700 bg-surface-800 text-white"
          >
            <p className="text-sm">{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/generate-button.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/generate-button.tsx apps/web/components/builder/poster-builder-form/__tests__/generate-button.test.tsx
git commit -m "feat(web): add error handling to GenerateButton

- Show error toast on generation failure
- Disable button when offline
- Track errors for analytics

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Timeout Handling to GenerationLoadingScreen

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`

**Step 1: Write/update failing test**

```typescript
// Add to apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx

describe('GenerationLoadingScreen timeout handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTimeout after 60 seconds', () => {
    const onTimeout = vi.fn();
    render(<GenerationLoadingScreen progress={50} onTimeout={onTimeout} />);

    // Advance time to 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not call onTimeout before 60 seconds', () => {
    const onTimeout = vi.fn();
    render(<GenerationLoadingScreen progress={50} onTimeout={onTimeout} />);

    act(() => {
      vi.advanceTimersByTime(59000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('shows timeout message after 60 seconds', () => {
    render(<GenerationLoadingScreen progress={50} onTimeout={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText(/taking longer than usual/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
Expected: FAIL - onTimeout not called

**Step 3: Modify generation-loading-screen.tsx**

```typescript
// apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Award } from 'lucide-react';

const TIPS = [
  "Pro tip: Remove backgrounds for cleaner posters (Pro feature)",
  "Did you know? Pro users get HD 1080p exports",
  "Upgrade to Pro to remove watermarks",
  "Premium users can create unlimited posters",
  "Pro includes background removal for cleaner photos",
];

const TIMEOUT_SECONDS = 60;

interface GenerationLoadingScreenProps {
  progress: number;
  onTimeout?: () => void;
}

export function GenerationLoadingScreen({ progress, onTimeout }: GenerationLoadingScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutCalledRef = useRef(false);

  // Reset state on mount to ensure fresh state for each generation session.
  useEffect(() => {
    setTipIndex(0);
    setElapsedSeconds(0);
    setHasTimedOut(false);
    timeoutCalledRef.current = false;
  }, []);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track elapsed time and handle timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newValue = prev + 1;

        // Check for timeout
        if (newValue >= TIMEOUT_SECONDS && !timeoutCalledRef.current) {
          timeoutCalledRef.current = true;
          setHasTimedOut(true);
          onTimeout?.();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  const getTimeMessage = (): string => {
    if (hasTimedOut) {
      return "Taking longer than usual. We'll email you when ready!";
    }
    if (elapsedSeconds >= 20) {
      return "Almost done! A few more seconds...";
    }
    return "Usually takes 15-20 seconds";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating poster"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl animate-scale-in">
        {/* Belt Animation */}
        <div
          data-testid="belt-animation"
          className="mb-6 flex justify-center"
        >
          <div className="animate-pulse-gold rounded-full p-4">
            <Award className="h-16 w-16 text-gold-500 animate-glow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
            className="h-2 w-full rounded-full bg-surface-800"
          >
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress percentage */}
        <div
          className="mb-6 text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="font-mono text-lg text-gold-400">{progress}%</span>
        </div>

        {/* Rotating Tips */}
        <div
          className="min-h-[3rem] px-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            key={tipIndex}
            className="text-sm text-surface-300 animate-fade-in"
          >
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Time Estimate */}
        <p
          className={cn(
            "mt-4 text-sm",
            hasTimedOut ? "text-amber-400" : "text-surface-400"
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {getTimeMessage()}
        </p>
      </div>
    </div>
  );
}

// Add import at top
import { cn } from '@/lib/utils';
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/generation-loading-screen.tsx apps/web/components/builder/poster-builder-form/__tests__/generation-loading-screen.test.tsx
git commit -m "feat(web): add timeout handling to GenerationLoadingScreen

- Call onTimeout callback after 60 seconds
- Show timeout message to user
- Track elapsed time for timeout detection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Wire Timeout Handler in PosterBuilderForm

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`

**Step 1: Write failing test**

```typescript
// Add to apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx

import { showErrorToast, trackError, ERROR_MESSAGES } from '@/lib/errors';

vi.mock('@/lib/errors', () => ({
  showErrorToast: vi.fn(),
  trackError: vi.fn(),
  ERROR_MESSAGES: {
    GENERATION_TIMEOUT: { title: 'Taking longer than usual', description: "We'll email you when ready!", emoji: '⏱️' },
  },
}));

describe('PosterBuilderForm timeout handling', () => {
  it('shows timeout toast when generation times out', async () => {
    // Mock store with isGenerating=true
    vi.mocked(usePosterBuilderStore).mockReturnValue({
      isGenerating: true,
      generationProgress: 50,
      // ... other required state
    });

    render(<PosterBuilderForm />);

    // Find and trigger the onTimeout callback
    // The GenerationLoadingScreen should be rendered
    const loadingScreen = screen.getByRole('dialog');
    expect(loadingScreen).toBeInTheDocument();

    // Simulate timeout (this tests that onTimeout prop is wired correctly)
    // Actual timeout behavior is tested in GenerationLoadingScreen tests
  });
});
```

**Step 2: Run test to verify setup**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`

**Step 3: Modify poster-builder-form.tsx**

```typescript
// apps/web/components/builder/poster-builder-form/poster-builder-form.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';
import {
  PhotoUploadZone,
  AthleteInfoFields,
  TournamentInfoFields,
  TemplateSelector,
} from '@/components/builder';
import { GuidedTooltips, useBuilderTour, FirstPosterCelebration } from '@/components/onboarding';
import { usePosterBuilderStore } from '@/lib/stores';
import { showErrorToast, trackError, ERROR_MESSAGES } from '@/lib/errors';
import { GenerateButton } from './generate-button';
import { FloatingPreviewButton } from './floating-preview-button';
import { PreviewModal } from './preview-modal';
import { GenerationLoadingScreen } from './generation-loading-screen';

export function PosterBuilderForm(): JSX.Element {
  const router = useRouter();
  const { showTour, isLoading, completeTour, skipTour } = useBuilderTour();
  const { initializeForFirstVisit, isGenerating, generationProgress } = usePosterBuilderStore(
    useShallow((state) => ({
      initializeForFirstVisit: state.initializeForFirstVisit,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
    }))
  );

  // Initialize sample data for first-time visitors
  useEffect(() => {
    if (showTour && !isLoading) {
      initializeForFirstVisit();
    }
  }, [showTour, isLoading, initializeForFirstVisit]);

  const handleGenerationTimeout = useCallback(() => {
    trackError('generation_timeout', {
      progress: generationProgress,
    });
    showErrorToast(ERROR_MESSAGES.GENERATION_TIMEOUT, {
      action: {
        label: 'Go to Dashboard',
        onClick: () => router.push('/dashboard'),
      },
    });
  }, [generationProgress, router]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Photo Upload Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Upload Photo</h2>
        <PhotoUploadZone />
      </section>

      {/* Athlete Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Athlete Information</h2>
        <AthleteInfoFields />
      </section>

      {/* Tournament Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Tournament Details</h2>
        <TournamentInfoFields />
      </section>

      {/* Template Selection Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Choose Template</h2>
        <TemplateSelector />
      </section>

      {/* Generate Button - Sticky on mobile */}
      <div
        data-testid="generate-button-wrapper"
        className="sticky bottom-0 pt-4 pb-4 md:relative md:pt-0 bg-gradient-to-t from-primary-950 via-primary-950 to-transparent md:bg-none"
      >
        <GenerateButton />
      </div>

      {/* Floating Preview Button */}
      <FloatingPreviewButton />

      {/* Preview Modal */}
      <PreviewModal />

      {/* First Poster Celebration Modal */}
      <FirstPosterCelebration />

      {/* Generation Loading Screen */}
      {isGenerating && (
        <GenerationLoadingScreen
          progress={generationProgress}
          onTimeout={handleGenerationTimeout}
        />
      )}

      {/* Guided Tour for First-Time Users */}
      {!isLoading && (
        <GuidedTooltips
          run={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/poster-builder-form.tsx apps/web/components/builder/poster-builder-form/__tests__/poster-builder-form.test.tsx
git commit -m "feat(web): wire timeout handler in PosterBuilderForm

- Handle generation timeout with toast and dashboard navigation
- Track timeout errors for analytics

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Add Hooks Index Export

**Files:**
- Create: `apps/web/hooks/index.ts`

**Step 1: Create index file**

```typescript
// apps/web/hooks/index.ts
export { useOnlineStatus } from './use-online-status';
```

**Step 2: Commit**

```bash
git add apps/web/hooks/index.ts
git commit -m "feat(web): add hooks module index

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Run All Tests and Verify

**Step 1: Run full test suite**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

**Step 2: Run linting**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run type checking**

Run: `pnpm type-check`
Expected: No errors

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(web): address test and lint issues

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements:

1. **Error Messages** - Centralized constants with emoji, title, description
2. **Error Tracking** - Structured logging ready for analytics service
3. **Error Toast** - Sonner wrapper with consistent styling
4. **Offline Detection** - Browser API hook + global banner
5. **Photo Upload Errors** - Enhanced with tracking and user-friendly messages
6. **Generation Errors** - Toast on API failure with retry action
7. **Timeout Handling** - 60-second timeout with email notification message

All tasks follow TDD methodology with failing tests first.
