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
