import { describe, expect, it } from 'vitest'
import { formatDate, todayIso } from '../../domain/format'

describe('formatDate', () => {
  it('formats an ISO date as a short English date', () => {
    expect(formatDate('2026-03-05')).toBe('Mar 5, 2026')
  })

  it('returns the original string when it cannot be parsed', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('todayIso', () => {
  it('returns an ISO yyyy-mm-dd string matching the real date', () => {
    const expected = new Date().toISOString().slice(0, 10)

    expect(todayIso()).toBe(expected)
  })
})
