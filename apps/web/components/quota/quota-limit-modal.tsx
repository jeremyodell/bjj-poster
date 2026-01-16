'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UpgradePrompt } from '@/components/upgrade'
import { track } from '@/lib/analytics'
import { getNextResetDate, formatResetDate } from './get-next-reset-date'
import type { Poster } from '@/lib/types/api'

export interface QuotaLimitModalProps {
  open: boolean
  posters: Poster[]
  onUpgrade: () => void
  onMaybeLater: () => void
}

const FREE_TIER_LIMIT = 2

export function QuotaLimitModal({
  open,
  posters,
  onUpgrade,
  onMaybeLater,
}: QuotaLimitModalProps) {
  const posterCount = posters.length
  const nextResetDate = getNextResetDate()
  const formattedDate = formatResetDate(nextResetDate)

  useEffect(() => {
    if (open) {
      track('quota_limit_modal_viewed', { postersCount: posterCount, tier: 'free' })
    }
  }, [open, posterCount])

  const handleUpgrade = () => {
    track('quota_limit_upgrade_clicked', { source: 'quota_modal' })
    onUpgrade()
  }

  const handleMaybeLater = () => {
    track('quota_limit_maybe_later_clicked', { nextResetDate: formattedDate })
    onMaybeLater()
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Prevent closing via dialog state change
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-surface-700 bg-surface-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display">
            {posterCount > 0
              ? `🎉 You've created ${posterCount} awesome posters this month!`
              : `🎉 You've hit your monthly limit!`}
          </DialogTitle>
        </DialogHeader>

        {/* Poster Gallery */}
        {posters.length > 0 && (
          <div className="flex justify-center gap-3 py-4">
            {posters.slice(0, 3).map((poster) => (
              <div
                key={poster.id}
                className="relative h-24 w-20 overflow-hidden rounded-lg border border-surface-700 shadow-lg"
              >
                <Image
                  src={poster.thumbnailUrl}
                  alt={`${poster.athleteName} poster`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <DialogDescription className="text-center text-lg text-surface-200">
          Ready for more?
        </DialogDescription>

        {/* Upgrade Prompt */}
        <div className="my-4">
          <UpgradePrompt
            variant="card"
            targetTier="pro"
            source="quota_modal"
            onCtaClick={handleUpgrade}
          />
        </div>

        {/* Alternative Option */}
        <p className="text-center text-sm text-surface-400">
          Or wait until {formattedDate} for {FREE_TIER_LIMIT} more free posters
        </p>

        {/* Maybe Later */}
        <Button
          variant="ghost"
          className="w-full text-surface-400 hover:text-surface-200"
          onClick={handleMaybeLater}
        >
          Maybe Later
        </Button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
