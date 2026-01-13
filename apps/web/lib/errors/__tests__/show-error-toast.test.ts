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
