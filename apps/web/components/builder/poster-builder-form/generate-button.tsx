'use client';

import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePosterBuilderStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/user-store';
import { useFirstPosterCelebration } from '@/components/onboarding';
import { cn } from '@/lib/utils';

export function GenerateButton(): JSX.Element {
  const router = useRouter();
  const { triggerCelebration } = useFirstPosterCelebration();
  const postersThisMonth = useUserStore((s) => s.postersThisMonth);
  const incrementUsage = useUserStore((s) => s.incrementUsage);

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
      const result = await generatePoster();

      // Check if this is the user's first poster
      if (postersThisMonth === 0) {
        // Show celebration (don't increment usage yet - dismiss will do it)
        triggerCelebration({
          imageUrl: result.imageUrl,
          posterId: result.posterId,
        });
      } else {
        // Normal flow: increment usage and navigate
        incrementUsage();
        router.push('/dashboard');
      }
    } catch (error) {
      // TODO: Show error toast
      console.error('Generation failed:', error);
    }
  };

  const buttonContent = isGenerating ? (
    <div className="flex items-center gap-3">
      <Loader2 data-testid="loading-spinner" className="h-5 w-5 animate-spin" />
      <span>Generating...</span>
      <span className="ml-1 font-mono text-gold-400">{generationProgress}%</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5" />
      <span>Generate Poster</span>
      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </div>
  );

  const button = (
    <div data-tour="generate-button">
      <Button
        size="xl"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'group w-full',
          isValid && !isGenerating && 'animate-pulse-gold'
        )}
      >
        {buttonContent}
      </Button>
    </div>
  );

  // Wrap disabled button in tooltip
  if (!isValid && !isGenerating) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="block w-full">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="border-surface-700 bg-surface-800 text-white"
          >
            <p className="text-sm">Complete all required fields to generate</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
