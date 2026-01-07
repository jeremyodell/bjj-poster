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

export function PhotoUploadZone({
  className,
}: PhotoUploadZoneProps): JSX.Element {
  const setPhoto = usePosterBuilderStore((state) => state.setPhoto);
  const { preview, error, isLoading, handleFile, clear } = usePhotoUpload();

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
