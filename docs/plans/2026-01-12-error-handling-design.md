# Error Handling & Edge Cases Design

**Issue:** ODE-82 - UI-POL-002: Error Handling & Edge Cases
**Date:** 2026-01-12
**Status:** Approved

## Overview

Comprehensive error handling with user-friendly messages for all failure scenarios in the poster builder flow.

## Architecture

### File Structure

```
lib/
  errors/
    error-messages.ts      # Centralized message constants
    error-tracking.ts      # trackError() analytics stub
    show-error-toast.ts    # Sonner wrapper with error styling
  validations/
    photo-validation.ts    # Photo size/type validation

components/
  ui/
    offline-banner.tsx     # Global offline detection banner
    field-error.tsx        # Inline form field error display

hooks/
  use-online-status.ts     # Online/offline state hook
```

### Integration Points

- **PosterBuilderForm** - Wraps generation flow with error handling, passes `onRetry` callbacks
- **Photo upload section** - Validates file size/type before upload, shows inline errors
- **Field validation** - Enhanced with consistent error styling
- **GenerationLoadingScreen** - Handles timeout scenario with "email when ready" messaging
- **Root layout** - OfflineBanner added globally

### Data Flow

```
User action → Validation/API call → Error occurs
    ↓
trackError() logs structured data
    ↓
showErrorToast() displays user-friendly message
    ↓
Component shows retry action (if recoverable)
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Toast system | Extend Sonner | Already integrated, avoid parallel notification systems |
| Offline detection | Browser API only | Simple, handles common cases, MVP-appropriate |
| Error analytics | Console + structured logging | Ready for real service later, no external deps now |
| Retry mechanism | Callback props | Keeps error UI simple, flexible per feature |
| Message management | Centralized constants | Easy to update, future i18n ready |

## Error Messages

```typescript
// lib/errors/error-messages.ts
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
} as const
```

## Component Specifications

### Custom Error Toast

```typescript
// lib/errors/show-error-toast.ts
import { toast } from 'sonner'

export function showErrorToast(
  message: { title: string; description: string; emoji?: string },
  options?: { action?: { label: string; onClick: () => void } }
) {
  toast.error(`${message.emoji || '❌'} ${message.title}`, {
    description: message.description,
    duration: 5000,
    action: options?.action,
  })
}
```

### Online Status Hook

```typescript
// hooks/use-online-status.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Offline Banner

```typescript
// components/ui/offline-banner.tsx
'use client'

import { useOnlineStatus } from '@/hooks/use-online-status'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
    >
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Reconnect to generate posters.</span>
    </div>
  )
}
```

### Error Tracking

```typescript
// lib/errors/error-tracking.ts
type ErrorType =
  | 'photo_too_large'
  | 'photo_invalid_format'
  | 'photo_upload_failed'
  | 'generation_timeout'
  | 'generation_api_failure'
  | 'quota_exceeded'
  | 'network_offline'
  | 'api_unreachable'
  | 'form_validation_error'

interface ErrorContext {
  [key: string]: string | number | boolean | undefined
}

export function trackError(type: ErrorType, context?: ErrorContext): void {
  const errorEvent = {
    type,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
  }

  console.error('[Error Tracked]', errorEvent)

  // TODO: Send to analytics service (Amplitude, Segment, etc.)
}
```

### Photo Validation

```typescript
// lib/validations/photo-validation.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic']

export function validatePhoto(file: File):
  | { valid: true }
  | { valid: false; error: 'too_large' | 'invalid_format' } {

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'too_large' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'invalid_format' }
  }

  return { valid: true }
}
```

## Error Scenarios

### Photo Upload Errors

| Error | Message | Actions |
|-------|---------|---------|
| File > 10MB | "Photo is too large. Try a smaller file or compress it." | Try Again, Learn How to Compress |
| Invalid format | "We only support JPG, PNG, and HEIC photos." | Choose Different Photo |
| Upload failed | "Upload failed. Check your connection and try again." | Retry Upload |

### Generation Errors

| Error | Message | Actions | Notes |
|-------|---------|---------|-------|
| Timeout (>60s) | "Taking longer than usual. We'll email you when ready!" | Go to Dashboard, Try Different Template | Generation continues in background |
| API failure | "Something went wrong on our end. We've been notified." | Try Again | Does NOT count toward quota |
| Quota exceeded | "You've used all 2 posters this month." | Upgrade to Pro, View Pricing | Block generation entirely |

### Network Errors

| Error | Display | Behavior |
|-------|---------|----------|
| Offline | Amber banner at top of page | Generate button disabled, form editable |
| API unreachable | Error toast | Retry action available |

## Testing Plan

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| `validatePhoto()` | File too large returns error, invalid type returns error, valid file passes |
| `showErrorToast()` | Calls Sonner with correct formatting, includes action when provided |
| `trackError()` | Logs structured event with timestamp and context |
| `useOnlineStatus` | Returns initial state, updates on online/offline events |
| `OfflineBanner` | Renders when offline, hidden when online |
| `FieldError` | Renders message, returns null when no message |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Photo upload | Selecting 15MB file shows "too large" error, selecting .gif shows format error, retry button re-opens picker |
| Generation timeout | After 60s shows timeout message, "Go to Dashboard" navigates correctly |
| Generation failure | API error shows toast with retry, retry re-triggers generation |
| Offline detection | Banner appears when offline, generate button disabled, banner disappears on reconnect |
| Form validation | Invalid submit shows inline errors, errors clear on valid input |

### Manual Testing Checklist

- [ ] Disconnect WiFi → banner appears
- [ ] Reconnect WiFi → banner disappears
- [ ] Upload 15MB image → error toast with retry
- [ ] Upload .gif → error toast with format message
- [ ] Trigger API failure → toast with "Try Again"
- [ ] Verify toasts auto-dismiss after 5 seconds
- [ ] Verify console shows structured error logs
