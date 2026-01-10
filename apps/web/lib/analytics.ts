// apps/web/lib/analytics.ts
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'
  | 'quota_limit_modal_viewed'
  | 'quota_limit_upgrade_clicked'
  | 'quota_limit_maybe_later_clicked'

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

export type EventProperties = UpgradePromptProperties | QuotaLimitProperties

export function track(event: AnalyticsEvent, properties: EventProperties): void {
  // Development: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics]', event, properties)
  }

  // Production: no-op until real provider configured
  // TODO: Wire to Segment/Posthog/etc
}
