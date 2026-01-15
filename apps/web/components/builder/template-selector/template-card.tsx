'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ImageOff, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/stores';
import { UpgradePrompt } from '@/components/upgrade';
import { track } from '@/lib/analytics';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  /** Use priority loading for above-the-fold images (recommended section) */
  priority?: boolean;
}

type TemplateTier = 'free' | 'pro' | 'premium';

const TIER_HIERARCHY: Record<TemplateTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

function canAccessTemplate(userTier: TemplateTier, templateTier: TemplateTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[templateTier];
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
  priority = false,
}: TemplateCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  const templateTier = (template.tier ?? 'free') as TemplateTier;
  const hasAccess = canAccessTemplate(subscriptionTier, templateTier);
  const isPremiumTemplate = templateTier !== 'free';

  const handleClick = () => {
    if (!hasAccess) {
      track('template_tier_upgrade_clicked', {
        template_id: template.id,
        template_tier: templateTier as 'pro' | 'premium',
      });
      setShowUpgradeModal(true);
      return;
    }
    onSelect(template.id);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group relative w-full rounded-xl text-left transition-all duration-300 ease-out-expo',
          'hover:scale-[1.02]',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-surface-950',
          isSelected
            ? 'ring-2 ring-gold-500 shadow-lg shadow-gold-500/10'
            : 'ring-1 ring-surface-800 hover:ring-surface-700'
        )}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-surface-800">
          {imageError ? (
            <div className="flex h-full w-full items-center justify-center bg-surface-800">
              <ImageOff className="h-8 w-8 text-surface-600" />
            </div>
          ) : (
            <>
              <Image
                src={template.thumbnailUrl}
                alt={template.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={priority}
                onError={() => setImageError(true)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Lock overlay for inaccessible templates */}
              {!hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Lock className="h-8 w-8 text-surface-300" />
                </div>
              )}
            </>
          )}

          {/* Tier badge - top left */}
          {isPremiumTemplate && (
            <div
              className={cn(
                'absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-gold-500/20 text-gold-400 border border-gold-500/30'
              )}
            >
              {templateTier === 'premium' && (
                <Crown data-testid="premium-crown-icon" className="h-2.5 w-2.5" />
              )}
              {templateTier.toUpperCase()}
            </div>
          )}

          {/* Selection indicator - top right */}
          {isSelected && (
            <div
              data-testid="checkmark-icon"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 shadow-lg shadow-gold-500/30"
            >
              <Check className="h-4 w-4 text-surface-950" strokeWidth={3} />
            </div>
          )}

          {/* Selected badge */}
          {isSelected && (
            <div className="absolute bottom-2 left-2 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-medium text-surface-950">
              Selected
            </div>
          )}
        </div>

        {/* Info section */}
        <div
          className={cn(
            'rounded-b-xl border-t px-3 py-3 transition-colors duration-300',
            isSelected
              ? 'border-gold-500/30 bg-surface-900'
              : 'border-surface-800 bg-surface-900/50 group-hover:bg-surface-900'
          )}
        >
          <p className="text-sm font-medium text-white">{template.name}</p>
        </div>
      </button>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          variant="modal"
          targetTier={templateTier as 'pro' | 'premium'}
          source="template_selection"
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
