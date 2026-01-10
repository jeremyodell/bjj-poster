'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, X, Crown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { track } from '@/lib/analytics'
import { getTierBenefits, getTierHeadline, type TargetTier } from './tier-benefits'

export type UpgradePromptVariant = 'banner' | 'card' | 'modal'

export interface UpgradePromptProps {
  variant: UpgradePromptVariant
  targetTier: TargetTier
  source: string
  onDismiss?: () => void
  onCtaClick?: () => void
}

export function UpgradePrompt({
  variant,
  targetTier,
  source,
  onDismiss,
  onCtaClick,
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
            {headline} for {benefits[0]?.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCtaClick ? (
            <Button
              size="sm"
              className="bg-gold-500 hover:bg-gold-600 text-surface-950"
              onClick={() => {
                handleCtaClick()
                onCtaClick()
              }}
            >
              Upgrade Now
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-gold-500 hover:bg-gold-600 text-surface-950">
              <Link href="/pricing" onClick={handleCtaClick}>
                Upgrade Now
              </Link>
            </Button>
          )}
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

  if (variant === 'card') {
    return (
      <div className="relative rounded-lg border border-gold-500/20 bg-surface-900/80 p-6 backdrop-blur">
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 p-1 text-surface-400 hover:text-surface-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-6 w-6 text-gold-500" />
          <h3 className="font-display text-xl text-surface-100">{headline}</h3>
        </div>
        <ul className="mb-6 space-y-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-surface-300">
              <Check className="h-4 w-4 text-gold-500" />
              {benefit}
            </li>
          ))}
        </ul>
        {onCtaClick ? (
          <Button
            className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950"
            onClick={() => {
              handleCtaClick()
              onCtaClick()
            }}
          >
            Upgrade Now
          </Button>
        ) : (
          <Button asChild className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950">
            <Link href="/pricing" onClick={handleCtaClick}>
              Upgrade Now
            </Link>
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <Dialog open onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="border-gold-500/20 bg-surface-900 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-gold-500" />
              <DialogTitle className="font-display text-2xl">{headline}</DialogTitle>
            </div>
          </DialogHeader>
          <ul className="my-4 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-surface-300">
                <Check className="h-5 w-5 text-gold-500" />
                {benefit}
              </li>
            ))}
          </ul>
          {onCtaClick ? (
            <Button
              className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950"
              onClick={() => {
                handleCtaClick()
                onCtaClick()
              }}
            >
              Upgrade Now
            </Button>
          ) : (
            <Button asChild className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950">
              <Link href="/pricing" onClick={handleCtaClick}>
                Upgrade Now
              </Link>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Placeholder for other variants
  return null
}
