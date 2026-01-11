// apps/web/lib/analytics.ts
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'
  | 'quota_limit_modal_viewed'
  | 'quota_limit_upgrade_clicked'
  | 'quota_limit_maybe_later_clicked'
  | 'first_poster_celebration_viewed'
  | 'first_poster_downloaded'
  | 'first_poster_shared'
  | 'first_poster_celebration_dismissed'

export interface UpgradePromptProperties {
  source: string
  targetTier: 'pro' | 'premium'
  variant: 'banner' | 'card' | 'modal'
}

export interface QuotaLimitProperties {
  postersCount?: number
  tier?: string
  source?: string
  nextResetDate?: string
}

export interface FirstPosterCelebrationProperties {
  tier?: string
  platform?: 'facebook' | 'native_share' | 'copy_link'
  source?: string
}

export type EventProperties = UpgradePromptProperties | QuotaLimitProperties | FirstPosterCelebrationProperties

export function track(event: AnalyticsEvent, properties: EventProperties): void {
  // Development: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics]', event, properties)
  }

  // Production: no-op until real provider configured
  // TODO: Wire to Segment/Posthog/etc
}
