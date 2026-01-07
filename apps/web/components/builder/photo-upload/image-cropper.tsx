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

  const handleCropComplete = useCallback(async (): Promise<void> => {
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
  }, [completedCrop, onCropComplete]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="overflow-hidden rounded-lg bg-primary-900">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- react-image-crop requires native img element */}
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
