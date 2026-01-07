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
