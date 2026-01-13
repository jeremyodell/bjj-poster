'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';
import {
  PhotoUploadZone,
  AthleteInfoFields,
  TournamentInfoFields,
  TemplateSelector,
} from '@/components/builder';
import { GuidedTooltips, useBuilderTour, FirstPosterCelebration } from '@/components/onboarding';
import { usePosterBuilderStore } from '@/lib/stores';
import { showErrorToast, trackError, ERROR_MESSAGES } from '@/lib/errors';
import { GenerateButton } from './generate-button';
import { FloatingPreviewButton } from './floating-preview-button';
import { PreviewModal } from './preview-modal';
import { GenerationLoadingScreen } from './generation-loading-screen';

export function PosterBuilderForm(): JSX.Element {
  const router = useRouter();
  const { showTour, isLoading, completeTour, skipTour } = useBuilderTour();
  const { initializeForFirstVisit, isGenerating, generationProgress } = usePosterBuilderStore(
    useShallow((state) => ({
      initializeForFirstVisit: state.initializeForFirstVisit,
      isGenerating: state.isGenerating,
      generationProgress: state.generationProgress,
    }))
  );

  // Initialize sample data for first-time visitors
  useEffect(() => {
    if (showTour && !isLoading) {
      initializeForFirstVisit();
    }
  }, [showTour, isLoading, initializeForFirstVisit]);

  const handleGenerationTimeout = useCallback(() => {
    trackError('generation_timeout', {
      progress: generationProgress,
    });
    showErrorToast(ERROR_MESSAGES.GENERATION_TIMEOUT, {
      action: {
        label: 'Go to Dashboard',
        onClick: () => router.push('/dashboard'),
      },
    });
  }, [generationProgress, router]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Photo Upload Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Upload Photo</h2>
        <PhotoUploadZone />
      </section>

      {/* Athlete Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Athlete Information</h2>
        <AthleteInfoFields />
      </section>

      {/* Tournament Info Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Tournament Details</h2>
        <TournamentInfoFields />
      </section>

      {/* Template Selection Section */}
      <section>
        <h2 className="font-display text-xl text-white mb-4">Choose Template</h2>
        <TemplateSelector />
      </section>

      {/* Generate Button - Sticky on mobile */}
      <div
        data-testid="generate-button-wrapper"
        className="sticky bottom-0 pt-4 pb-4 md:relative md:pt-0 bg-gradient-to-t from-primary-950 via-primary-950 to-transparent md:bg-none"
      >
        <GenerateButton />
      </div>

      {/* Floating Preview Button */}
      <FloatingPreviewButton />

      {/* Preview Modal */}
      <PreviewModal />

      {/* First Poster Celebration Modal */}
      <FirstPosterCelebration />

      {/* Generation Loading Screen */}
      {isGenerating && (
        <GenerationLoadingScreen
          progress={generationProgress}
          onTimeout={handleGenerationTimeout}
        />
      )}

      {/* Guided Tour for First-Time Users */}
      {!isLoading && (
        <GuidedTooltips
          run={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}
