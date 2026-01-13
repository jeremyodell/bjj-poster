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
