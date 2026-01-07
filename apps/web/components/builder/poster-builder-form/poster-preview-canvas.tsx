'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';
import { useTemplates } from '@/lib/hooks/use-templates';

const BELT_COLORS: Record<string, string> = {
  white: 'bg-gray-100 border border-gray-300',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-black',
  'red-black': 'bg-gradient-to-r from-red-600 to-black',
  red: 'bg-red-600',
};

interface PosterPreviewCanvasProps {
  className?: string;
}

export function PosterPreviewCanvas({ className }: PosterPreviewCanvasProps): JSX.Element {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    date,
    location,
    selectedTemplateId,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      date: state.date,
      location: state.location,
      selectedTemplateId: state.selectedTemplateId,
    }))
  );

  const { data: templates } = useTemplates();
  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Create object URL for photo preview
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (athletePhoto) {
      const url = URL.createObjectURL(athletePhoto);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPhotoUrl(null);
    }
  }, [athletePhoto]);

  return (
    <div
      data-testid="poster-preview-canvas"
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-primary-900',
        className
      )}
    >
      {/* Layer 1: Template background */}
      {selectedTemplate ? (
        <Image
          data-testid="template-background"
          src={selectedTemplate.thumbnailUrl}
          alt={selectedTemplate.name}
          fill
          className="object-cover"
        />
      ) : (
        <div
          data-testid="template-placeholder"
          className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950"
        >
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px]" />
        </div>
      )}

      {/* Layer 2: Photo zone */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] aspect-[3/4]">
        {photoUrl ? (
          <img
            data-testid="athlete-photo"
            src={photoUrl}
            alt="Athlete"
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
        ) : (
          <div
            data-testid="photo-placeholder"
            className="w-full h-full flex items-center justify-center bg-primary-800/50 rounded-lg border-2 border-dashed border-primary-600"
          >
            <User className="w-16 h-16 text-primary-500" />
          </div>
        )}
      </div>

      {/* Layer 3: Text overlays */}
      <div className="absolute bottom-[5%] left-0 right-0 px-4 text-center space-y-2">
        {athleteName && (
          <h2 className="font-display text-xl text-white font-bold drop-shadow-lg">
            {athleteName}
          </h2>
        )}

        <div
          data-testid="belt-indicator"
          className={cn('inline-block h-2 w-20 rounded-full', BELT_COLORS[beltRank])}
        />

        {tournament && (
          <p className="text-sm text-primary-200 font-medium">{tournament}</p>
        )}

        {(date || location) && (
          <div className="text-xs text-primary-300 space-x-2">
            {date && <span>{date}</span>}
            {location && <span>{location}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
