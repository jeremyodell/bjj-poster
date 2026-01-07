'use client';

import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePosterBuilderStore } from '@/lib/stores';
import { PosterPreviewCanvas } from './poster-preview-canvas';

export function PreviewModal(): JSX.Element | null {
  const { showPreview, togglePreview } = usePosterBuilderStore(
    useShallow((state) => ({
      showPreview: state.showPreview,
      togglePreview: state.togglePreview,
    }))
  );

  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartY.current = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch) {
      const deltaY = touch.clientY - touchStartY.current;
      if (deltaY > 100) {
        togglePreview();
      }
    }
  };

  return (
    <Dialog open={showPreview} onOpenChange={togglePreview}>
      <DialogContent
        data-testid="preview-modal-content"
        className="max-w-[800px] h-[90vh] md:h-auto p-0 md:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Poster Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of your poster with current form data
        </DialogDescription>
        <div className="flex items-center justify-center h-full p-4 md:p-0">
          <PosterPreviewCanvas className="max-h-full w-full max-w-[400px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
