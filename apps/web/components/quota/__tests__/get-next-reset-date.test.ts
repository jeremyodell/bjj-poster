import { describe, it, expect, vi, afterEach } from 'vitest'
import { getNextResetDate, formatResetDate } from '../get-next-reset-date'

describe('getNextResetDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns first day of next month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))

    const result = getNextResetDate()

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(1) // February (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it('handles December correctly (rolls to January)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-25'))

    const result = getNextResetDate()

    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(0) // January
    expect(result.getDate()).toBe(1)
  })
})

describe('formatResetDate', () => {
  it('formats date as "Month Day"', () => {
    // Use year, month (0-indexed), day to avoid timezone issues
    const date = new Date(2026, 1, 1) // February 1, 2026
    expect(formatResetDate(date)).toBe('February 1')
  })

  it('formats January correctly', () => {
    const date = new Date(2027, 0, 1) // January 1, 2027
    expect(formatResetDate(date)).toBe('January 1')
  })
})
