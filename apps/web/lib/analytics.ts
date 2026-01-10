// apps/web/lib/analytics.ts
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'

export interface EventProperties {
  source: string
  targetTier: 'pro' | 'premium'
  variant: 'banner' | 'card' | 'modal'
}

export function track(event: AnalyticsEvent, properties: EventProperties): void {
  // Development: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics]', event, properties)
  }

  // Production: no-op until real provider configured
  // TODO: Wire to Segment/Posthog/etc
}
