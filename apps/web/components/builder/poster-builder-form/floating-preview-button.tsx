'use client';

import { Eye } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';

export function FloatingPreviewButton(): JSX.Element | null {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    togglePreview,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      togglePreview: state.togglePreview,
    }))
  );

  // Check if any form data exists
  const hasAnyData = Boolean(
    athletePhoto ||
    athleteName.trim() ||
    tournament.trim() ||
    selectedTemplateId
  );

  // Check if all required fields are valid
  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  // Don't render if no data
  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-8">
      <Button
        variant="secondary"
        size="icon"
        onClick={togglePreview}
        aria-label="Preview poster"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          isValid && 'animate-pulse-subtle'
        )}
      >
        <Eye data-testid="eye-icon" className="h-6 w-6" />
      </Button>
    </div>
  );
}
