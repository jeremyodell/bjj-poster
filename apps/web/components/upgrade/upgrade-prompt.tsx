'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { getTierBenefits, getTierHeadline, type TargetTier } from './tier-benefits'
import { cn } from '@/lib/utils'

export type UpgradePromptVariant = 'banner' | 'card' | 'modal'

export interface UpgradePromptProps {
  variant: UpgradePromptVariant
  targetTier: TargetTier
  source: string
  onDismiss?: () => void
}

export function UpgradePrompt({
  variant,
  targetTier,
  source,
  onDismiss,
}: UpgradePromptProps) {
  const headline = getTierHeadline(targetTier)
  const benefits = getTierBenefits(targetTier)

  useEffect(() => {
    track('upgrade_prompt_viewed', { source, targetTier, variant })
  }, [source, targetTier, variant])

  const handleCtaClick = () => {
    track('upgrade_prompt_clicked', { source, targetTier, variant })
  }

  const handleDismiss = () => {
    track('upgrade_prompt_dismissed', { source, targetTier, variant })
    onDismiss?.()
  }

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-gold-500/20 bg-gold-500/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold-500" />
          <p className="text-sm font-medium text-surface-100">
            {headline} for {benefits[0].toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-gold-500 hover:bg-gold-600 text-surface-950">
            <Link href="/pricing" onClick={handleCtaClick}>
              Upgrade Now
            </Link>
          </Button>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 text-surface-400 hover:text-surface-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Placeholder for other variants
  return null
}
