'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Download, Share2, Copy, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareModal } from './share-modal';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import type { Poster } from '@/lib/types/api';
import type { BeltRank } from '@/lib/stores/poster-builder-store';

interface PosterCardProps {
  poster: Poster;
}

/**
 * Converts display belt rank to store belt rank format
 */
function toBeltRank(displayRank: string): BeltRank {
  const normalized = displayRank.toLowerCase().replace(' belt', '');
  const validRanks: BeltRank[] = ['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red'];
  return validRanks.includes(normalized as BeltRank) ? (normalized as BeltRank) : 'white';
}

/**
 * Formats ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PosterCard({ poster }: PosterCardProps): JSX.Element {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(poster.thumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${poster.tournament.replace(/\s+/g, '-').toLowerCase()}-poster.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDuplicate = () => {
    usePosterBuilderStore.getState().loadFromPoster({
      templateId: poster.templateId,
      athleteName: poster.athleteName,
      tournament: poster.tournament,
      beltRank: toBeltRank(poster.beltRank),
    });
    router.push('/builder');
  };

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posters/${poster.id}`;

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:border-gold-500/30 hover:shadow-gold-500/10">
        {/* Thumbnail */}
        <div className="relative aspect-[3/4] bg-surface-800">
          {poster.thumbnailUrl && !imageError ? (
            <Image
              src={poster.thumbnailUrl}
              alt={poster.tournament}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              data-testid="thumbnail-placeholder"
              className="flex h-full items-center justify-center"
            >
              <ImageIcon className="h-12 w-12 text-surface-600" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="mb-1 truncate font-display text-lg tracking-wide text-white">
            {poster.tournament}
          </h3>

          {/* Subtitle */}
          <p className="mb-3 text-sm text-surface-400">
            {poster.beltRank} &bull; {formatDate(poster.createdAt)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              aria-label="Download"
              title="Download"
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(true)}
              aria-label="Share"
              title="Share"
              className="h-8 w-8"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDuplicate}
              aria-label="Duplicate"
              title="Duplicate to builder"
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        posterUrl={shareUrl}
        posterTitle={poster.tournament}
      />
    </>
  );
}
