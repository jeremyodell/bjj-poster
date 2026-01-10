// apps/web/lib/__tests__/analytics.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { track } from '../analytics'

describe('analytics', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs event to console in development', () => {
    track('upgrade_prompt_viewed', {
      source: 'test',
      targetTier: 'pro',
      variant: 'banner',
    })

    expect(console.log).toHaveBeenCalledWith(
      '[Analytics]',
      'upgrade_prompt_viewed',
      { source: 'test', targetTier: 'pro', variant: 'banner' }
    )
  })

  it('accepts all valid event types', () => {
    const events = [
      'upgrade_prompt_viewed',
      'upgrade_prompt_clicked',
      'upgrade_prompt_dismissed',
    ] as const

    events.forEach((event) => {
      expect(() =>
        track(event, { source: 'test', targetTier: 'premium', variant: 'card' })
      ).not.toThrow()
    })
  })
})
