import { useState, useCallback, useRef } from 'react';

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

  return { file, preview, error, isLoading, handleFile, clear };
}
