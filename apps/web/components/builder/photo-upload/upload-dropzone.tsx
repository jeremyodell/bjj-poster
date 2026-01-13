'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, ImagePlus } from 'lucide-react';
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
    // Only deactivate if leaving the dropzone entirely, not when entering child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
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
          'group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-300',
          'border-surface-700 bg-surface-900/30',
          'hover:border-gold-500/50 hover:bg-surface-900/50',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-surface-950',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDragActive && 'border-gold-500 bg-gold-500/5 scale-[1.01]',
          error && 'border-red-500/50'
        )}
      >
        {isLoading ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-gold-500/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-surface-700 bg-surface-800">
                <Loader2
                  data-testid="loading-spinner"
                  className="h-8 w-8 animate-spin text-gold-500"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="mt-5 text-sm font-medium text-surface-300">Processing image...</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-surface-700 bg-surface-800 transition-all duration-300 group-hover:border-gold-500/50 group-hover:shadow-gold-sm">
                {isDragActive ? (
                  <ImagePlus className="h-8 w-8 text-gold-500" />
                ) : (
                  <Upload
                    data-testid="upload-icon"
                    className="h-8 w-8 text-surface-400 transition-colors group-hover:text-gold-500"
                  />
                )}
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-sm font-medium text-white">
                {isDragActive ? (
                  <span className="text-gold-400">Drop your photo here</span>
                ) : (
                  <>
                    <span className="text-gold-500">Click to upload</span>
                    <span className="text-surface-400"> or drag and drop</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-xs text-surface-500">
                JPG, PNG, HEIC up to 10MB
              </p>
            </div>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        onChange={handleInputChange}
        className="sr-only"
      />

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
