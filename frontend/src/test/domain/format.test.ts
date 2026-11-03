import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatDateTime, todayIso } from '../../domain/format'

describe('formatDate', () => {
  it('formats an ISO date as a short English date', () => {
    expect(formatDate('2026-03-05')).toBe('Mar 5, 2026')
  })

  it('returns the original string when it cannot be parsed', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateTime', () => {
  it('formats a timestamp as a short English date with time', () => {
    expect(formatDateTime('2026-03-05T14:07:00')).toBe('Mar 5, 2026, 2:07 PM')
  })

  it('returns the original string when it cannot be parsed', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})

describe('todayIso', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the local date as yyyy-mm-dd', () => {
    const now = new Date()
    const expected = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((n, i) => (i === 0 ? String(n) : String(n).padStart(2, '0')))
      .join('-')

    expect(todayIso()).toBe(expected)
  })

  it('uses the local calendar day, not the UTC one, just after local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 3, 0, 30))

    expect(todayIso()).toBe('2026-11-03')
  })
})
