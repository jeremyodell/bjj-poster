'use client';

import { Loader2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePosterBuilderStore } from '@/lib/stores';

export function GenerateButton(): JSX.Element {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    isGenerating,
    generationProgress,
    generatePoster,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
      generatePoster: state.generatePoster,
    }))
  );

  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  const isDisabled = !isValid || isGenerating;

  const handleClick = async () => {
    if (isDisabled) return;

    try {
      await generatePoster();
      // TODO: Handle success (show result, navigate to poster)
    } catch (error) {
      // TODO: Show error toast
      console.error('Generation failed:', error);
    }
  };

  const buttonContent = isGenerating ? (
    <>
      <Loader2 data-testid="loading-spinner" className="h-4 w-4 animate-spin" />
      <span>Generating... {generationProgress}%</span>
    </>
  ) : (
    <span>Generate Poster</span>
  );

  const button = (
    <Button
      size="lg"
      disabled={isDisabled}
      onClick={handleClick}
      className="w-full"
    >
      {buttonContent}
    </Button>
  );

  // Wrap disabled button in tooltip
  if (!isValid && !isGenerating) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Complete required fields to generate</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
